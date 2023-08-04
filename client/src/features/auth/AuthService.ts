/** @format */
import { User } from "../../models/BooruUser";
import { LocalSettings } from "../../util/LocalSettings";
import { BooruRequest } from "../BooruRequest";

export interface Credentials {
	username: string;
	password: string;
}

class AuthService {
	static async login(credentials: Credentials): Promise<User> {
		const { username, password } = credentials;
		const url = `/api/shimmie/get_user?name=${encodeURIComponent(username)}`;
		BooruRequest.init(username, password);
		return BooruRequest.runQueryJson(url)
			.then(obj => new User(obj))
			.then(user => {
				LocalSettings.username.value = username;
				LocalSettings.password.value = password;
				return user;
			});
	}

	static logout() {
		LocalSettings.username.clear();
		LocalSettings.password.clear();
	}
}

export default AuthService;
