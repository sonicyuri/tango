/** @format */
import { ShimmieUser, User } from "../../models/BooruUser";
import { LocalSettings } from "../../util/LocalSettings";
import { LogFactory } from "../../util/Logger";
import { Util } from "../../util/Util";
import { BooruRequest, CredentialsInvalidError } from "../BooruRequest";

const BASE_URL = "https://tango.moe/api";

interface JwtToken {
	token: string;
	expires: string;
}

interface LoginApiResult {
	access: JwtToken;
	refresh: JwtToken | null;
	user: ShimmieUser;
}

type LoginApiResponse = { type: "success"; result: LoginApiResult } | { type: "error"; message: string };

interface RefreshApiResult {
	access: JwtToken;
	user: ShimmieUser;
}

type RefreshApiResponse = { type: "success"; result: RefreshApiResult } | { type: "error"; message: string };

type InfoApiResponse =
	| { type: "success"; result: ShimmieUser }
	| { type: "error"; message: string }
	| { type: "needs_auth" };

export interface Credentials {
	username: string;
	password: string;
	rememberMe: boolean;
}

export type AuthResponse = { type: "success"; result: User } | { type: "error"; message: string } | { type: "reset" };

const logger = LogFactory.create("AuthService");

class AuthService {
	static async login(credentials: Credentials): Promise<AuthResponse> {
		BooruRequest.init(null);

		return BooruRequest.runQueryVersioned("v2", "/user/login", "POST", credentials)
			.then(res => res.json())
			.then(rawRes => {
				const res = rawRes as LoginApiResponse;
				if (res.type == "error") {
					return { type: "error", message: res.message };
				}

				LocalSettings.accessToken.value = res.result.access.token;
				LocalSettings.accessTokenExpire.value = res.result.access.expires;

				if (res.result.refresh) {
					LocalSettings.refreshToken.value = res.result.refresh.token;
					LocalSettings.refreshTokenExpire.value = res.result.refresh.expires;
				}

				BooruRequest.init(res.result.access.token);
				return { type: "success", result: new User(res.result.user) };
			});
	}

	static async loginToken(accessToken: string, refreshToken: string | null): Promise<AuthResponse> {
		BooruRequest.init(accessToken);

		return BooruRequest.runQueryVersioned("v2", "/user/info", "GET")
			.then(res => res.json())
			.then(rawRes => {
				const res = rawRes as InfoApiResponse;
				if (res.type == "error") {
					return { type: "error", message: res.message };
				} else if (res.type == "needs_auth") {
					if (!refreshToken) {
						return { type: "error", message: "token expired" };
					}

					return this.refresh(refreshToken).then(res => {
						if (res.type == "error") {
							logger.error("error refreshing user: ", res.message);
							// clear it all out and try again
							return { type: "reset" };
						}

						return res;
					});
				}

				return { type: "success", result: new User(res.result) };
			});
	}

	static async refresh(refreshToken: string): Promise<AuthResponse> {
		BooruRequest.init(null);

		const params = new URLSearchParams();
		params.append("refreshToken", refreshToken);

		return BooruRequest.runQueryVersioned("v2", "/user/refresh", "POST", params)
			.then(res => res.json())
			.then(rawRes => {
				const res = rawRes as RefreshApiResponse;
				if (res.type == "error") {
					return { type: "error", message: res.message };
				}

				LocalSettings.accessToken.value = res.result.access.token;
				LocalSettings.accessTokenExpire.value = res.result.access.expires;
				BooruRequest.init(res.result.access.token);

				return { type: "success", result: new User(res.result.user) };
			});
	}

	static logout() {
		LocalSettings.accessToken.clear();
		LocalSettings.accessTokenExpire.clear();
		LocalSettings.refreshToken.clear();
		LocalSettings.refreshTokenExpire.clear();
		LocalSettings.username.clear();
	}
}

export default AuthService;
