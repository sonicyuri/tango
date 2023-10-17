/** @format */

import { BooruRequest } from "../BooruRequest";

export interface UserConfig {
	tag_mappings?: { [service: string]: { [tag: string]: string } };
}

export type UserConfigResponse = { type: "success"; result: UserConfig } | { type: "error"; message: string };

class UserConfigService {
	static get(): Promise<UserConfigResponse> {
		return BooruRequest.runQueryJsonV2("/user/config/get");
	}

	static set(config: UserConfig): Promise<UserConfigResponse> {
		return BooruRequest.runQueryVersioned("v2", "/user/config/set?replace=true", "POST", config).then(v =>
			v.json()
		);
	}
}

export default UserConfigService;
