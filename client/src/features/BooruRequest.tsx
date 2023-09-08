/** @format */
import base64 from "base-64";

import { LogFactory, Logger } from "../util/Logger";
import { PostSearchCursor } from "./PostSearchCursor";

const BASE_URL = "https://booru.anime.lgbt";
const AUTH_BASE_URL = "https://tango.moe/api";

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

	static init(accessToken: string | null): void {
		this.authHeader = accessToken ? "Bearer " + accessToken : "";
	}

	/**
	 * Runs a query to the given endpoint with the given method and body.
	 * V1 targets the original Shimmie API
	 * V2 targets the new Tango API
	 */
	static runQueryVersioned(
		version: "v1" | "v2",
		endpoint: string,
		method: string,
		body: RequestBody = undefined
	): Promise<Response> {
		const url = (version == "v1" ? BASE_URL : AUTH_BASE_URL) + endpoint;

		const headers = new Headers();
		headers.append("Authorization", this.authHeader || "");
		if (version == "v2") {
			headers.append("Content-Type", "application/json");
		}
		return fetch(url, {
			method: method,
			headers: headers,
			body: BooruRequest.getRequestBody(body, version)
		}).then(res => {
			if (res.status == 403 || res.status == 401) {
				return Promise.reject(new CredentialsInvalidError("Credentials rejected!"));
			}

			return res;
		});
	}

	static runQuery(url: string, method: string, body: RequestBody): Promise<Response> {
		return this.runQueryVersioned("v1", url, method, body);
	}

	static runGetQuery(url: string): Promise<Response> {
		return this.runQuery(url, "GET", undefined);
	}

	static runQueryJson(url: string): Promise<any> {
		return this.runGetQuery(url).then(res => res.json());
	}

	static searchPosts(query: string | null, page = 1): PostSearchCursor {
		const cursor = new PostSearchCursor(query);
		cursor.setCursorPosition(Math.max(page, 1), 0);
		return cursor;
	}

	private static getRequestBody(body: RequestBody, version: "v1" | "v2"): URLSearchParams | string | undefined {
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
			const params = new URLSearchParams();
			for (const k of Object.keys(body)) {
				params.append(k, body[k]);
			}

			return params;
		}

		return JSON.stringify(body);
	}
}

export { BooruRequest };
