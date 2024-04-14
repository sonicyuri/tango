/** @format */
import { User } from "../../models/BooruUser";
import { LocalSettings } from "../../util/LocalSettings";
import { LogFactory } from "../../util/Logger";
import { ApiResponse } from "../ApiResponse";
import { BooruRequest } from "../BooruRequest";
import { Credentials, LoginApiResult, SignupRequest } from "./AuthSchema";

const logger = LogFactory.create("AuthService");

class AuthService {
	static async login(credentials: Credentials): Promise<ApiResponse<User>> {
		BooruRequest.init(null);

		return BooruRequest.queryResultAdvanced<LoginApiResult>(
			"/user/login",
			"POST",
			credentials
		).then(res =>
			res.map(val => {
				LocalSettings.accessToken.value = val.access.token;
				LocalSettings.accessTokenExpire.value = val.access.expires;
				if (val.refresh) {
					LocalSettings.refreshToken.value = val.refresh.token;
					LocalSettings.refreshTokenExpire.value =
						val.refresh.expires;
				}

				BooruRequest.init(val.access.token);
				return new User(val.user);
			})
		);
	}

	static async loginToken(accessToken: string): Promise<ApiResponse<User>> {
		BooruRequest.init(accessToken);

		return BooruRequest.queryResult<User>("/user/info");
	}

	static logout() {
		LocalSettings.accessToken.clear();
		LocalSettings.accessTokenExpire.clear();
		LocalSettings.refreshToken.clear();
		LocalSettings.refreshTokenExpire.clear();
		LocalSettings.username.clear();
	}

	static async signup(request: SignupRequest): Promise<ApiResponse<User>> {
		return BooruRequest.queryResultAdvanced<User>(
			"/user/signup",
			"POST",
			request
		);
	}
}

export default AuthService;
