/** @format */
import getTangoConfig from "../TangoConfig";

import { LocalSettings } from "../util/LocalSettings";
import { LogFactory, Logger } from "../util/Logger";
import { Util } from "../util/Util";
import {
	ApiResponse,
	CredentialsFailedErrorResponse,
	RawApiResponse
} from "./ApiResponse";
import { RefreshApiResponse } from "./auth/AuthSchema";

const TangoConfig = getTangoConfig();
const EndpointV1Url = TangoConfig.endpoints.v1;
const EndpointV2Url = TangoConfig.endpoints.v2;

export class CredentialsInvalidError extends Error {
	constructor(message: string) {
		super(message);

		Object.setPrototypeOf(this, CredentialsInvalidError.prototype);
	}
}

type RequestBody = URLSearchParams | { [k: string]: any } | undefined;

class BooruRequest {
	private static authHeader: string | null = null;
	private static logger: Logger = LogFactory.create("BooruRequest");

	private static isAttemptingRefresh: boolean = false;
	private static requestsPendingRefresh: {
		input: RequestInfo | URL;
		init?: RequestInit;
		resolve: (value: any) => void;
		reject: (reason?: any) => void;
	}[] = [];

	static init(accessToken: string | null): void {
		this.authHeader = accessToken ? "Bearer " + accessToken : "";
	}

	static isAuthenticated(): boolean {
		return this.authHeader != null;
	}

	/**
	 * Equivalent to {@link fetch}, but handles credential errors and refresh tokens.
	 * @param res
	 */
	private static fetchAuthAware(
		endpoint: string,
		origInit?: RequestInit
	): Promise<Response> {
		const url = EndpointV2Url + endpoint;
		const body = origInit?.body;

		const init = origInit ?? {};
		init.headers = this.createHeaders({
			"Content-Type": "application/json",
			"Authorization": this.authHeader || ""
		});

		return new Promise((resolve, reject) => {
			const requestInfo = { input: url, init, resolve, reject };
			if (this.isAttemptingRefresh) {
				this.requestsPendingRefresh.push(requestInfo);
				return;
			}

			const error = new CredentialsFailedErrorResponse(endpoint, body);

			fetch(url, init).then(res => {
				if (res.status == 403 || res.status == 401) {
					// some other request has already started a refresh, queue this one up
					if (this.isAttemptingRefresh) {
						this.requestsPendingRefresh.push(requestInfo);
						return;
					}

					// access token was rejected but we have a refresh token
					if (
						LocalSettings.refreshToken.value &&
						Util.checkIfTokenValid(
							LocalSettings.refreshTokenExpire.value ?? ""
						)
					) {
						this.isAttemptingRefresh = true;

						// make refresh request
						fetch(EndpointV2Url + "/user/refresh", {
							method: "POST",
							headers: this.createHeaders({
								"Content-Type": "application/json"
							}),
							body: JSON.stringify({
								"refresh_token":
									LocalSettings.refreshToken.value
							})
						})
							.then(res => res.json())
							.catch(reason => {
								this.requestsPendingRefresh.forEach(info =>
									info.reject(reason)
								);
								this.requestsPendingRefresh = [];
								reject(reason);
							})
							.then(rawRes => {
								const res = rawRes as RefreshApiResponse;

								if (res.type == "error") {
									// we failed to refresh, tell everyone we failed

									this.requestsPendingRefresh.forEach(
										info => {
											info.reject(error);
										}
									);

									return reject(error);
								}

								// we got a new token! update our records
								LocalSettings.accessToken.value =
									res.result.access.token;
								LocalSettings.accessTokenExpire.value =
									res.result.access.expires;
								BooruRequest.init(res.result.access.token);

								// redo all these requests with a now-valid token
								this.isAttemptingRefresh = false;

								// redo the request but just give up if we get another credential error
								const redoRequest = (
									thisInput: RequestInfo | URL,
									oldInit: RequestInit | undefined,
									thisResolve: (value: any) => void,
									thisReject: (reason?: any) => void
								) => {
									const thisInit = oldInit ?? {};
									thisInit.headers = this.createHeaders({
										"Content-Type": "application/json",
										"Authorization": this.authHeader
									});

									fetch(thisInput, thisInit).then(res => {
										if (
											res.status == 401 ||
											res.status == 403
										) {
											return thisReject(error);
										}

										thisResolve(res);
									});
								};

								this.requestsPendingRefresh.forEach(info => {
									redoRequest(
										info.input,
										info.init,
										info.resolve,
										info.reject
									);
								});

								this.requestsPendingRefresh = [];

								// redo this request and finally resolve the promise
								redoRequest(url, init, resolve, reject);
							});
					} else {
						// no refresh token...
						reject(error);
					}
				} else {
					resolve(res);
				}
			});
		});
	}

	private static fetchJsonAuthAware(
		endpoint: string,
		init?: RequestInit
	): Promise<any> {
		return this.fetchAuthAware(endpoint, init).then(res => res.json());
	}

	static queryResult<T>(endpoint: string): Promise<ApiResponse<T>> {
		return this.queryResultAdvanced(endpoint, "GET");
	}

	static queryResultAdvanced<T>(
		endpoint: string,
		method: "GET" | "POST",
		body?: RequestBody
	): Promise<ApiResponse<T>> {
		const requestBody = BooruRequest.getRequestBody(body, "v2");

		return this.fetchJsonAuthAware(endpoint, {
			method: method,
			body: requestBody
		}).then(res => {
			const rawResult = res as RawApiResponse<T>;
			return ApiResponse.fromRaw(rawResult, endpoint, requestBody);
		});
	}

	/**
	 * Runs a query to the given endpoint with the given method and body.
	 * @param version V2 targets the new Tango API. V1 is no longer supported.
	 * @deprecated Use {@link queryResult} and {@link queryResultAdvanced}.
	 */
	static runQueryVersioned(
		version: "v1" | "v2",
		endpoint: string,
		method: string,
		body: RequestBody = undefined
	): Promise<Response> {
		if (version === "v1") {
			throw new Error("Endpoint v1 no longer supported!");
		}

		return this.fetchAuthAware(endpoint, {
			method: method,
			body: BooruRequest.getRequestBody(body, version)
		});
	}

	static runUploadQuery(
		endpoint: string,
		body: FormData,
		progressCallback: (percent: number) => void
	): Promise<any> {
		const url = EndpointV2Url + endpoint;

		const xhr = new XMLHttpRequest();
		return new Promise((resolve, reject) => {
			xhr.upload.addEventListener("progress", event => {
				if (event.lengthComputable) {
					progressCallback(event.loaded / event.total);
				}
			});
			xhr.addEventListener("loadend", () => {
				if (xhr.readyState === 4 && xhr.status === 200) {
					resolve(JSON.parse(xhr.responseText));
				} else {
					if (xhr.status == 403 || xhr.status == 401) {
						return reject(
							new CredentialsInvalidError("Credentials rejected!")
						);
					}

					reject("HTTP status code: " + xhr.status);
				}
			});
			xhr.open("POST", url, true);
			xhr.setRequestHeader("Authorization", this.authHeader || "");
			xhr.send(body);
		});
	}

	static runQuery(
		url: string,
		method: string,
		body: RequestBody
	): Promise<Response> {
		return this.runQueryVersioned("v1", url, method, body);
	}

	static runGetQuery(url: string): Promise<Response> {
		return this.runQuery(url, "GET", undefined);
	}

	static runQueryJson(url: string): Promise<any> {
		return this.runGetQuery(url).then(res => res.json());
	}

	static runQueryJsonV2(url: string): Promise<any> {
		return this.runQueryVersioned("v2", url, "GET", undefined).then(res =>
			res.json()
		);
	}

	private static getRequestBody(
		body: RequestBody,
		version: "v1" | "v2"
	): URLSearchParams | string | undefined {
		if (body == undefined) {
			return undefined;
		}

		if (body instanceof URLSearchParams) {
			if (version == "v1") {
				return body;
			}

			const res: { [k: string]: any } = {};
			for (const k of body.keys()) {
				res[k] = body.get(k);
			}

			return JSON.stringify(res);
		}

		if (version == "v1") {
			return Util.objectToUrlParams(body);
		}

		return JSON.stringify(body);
	}

	private static createHeaders(obj: { [name: string]: any }): Headers {
		const headers = new Headers();
		Object.keys(obj).forEach(k => {
			headers.append(k, obj[k]);
		});
		return headers;
	}
}

export { BooruRequest };
