/** @format */

import { BooruRequest } from "../BooruRequest";

export interface ImportOptions {
	mappings: { [tag: string]: string };
	deleted_tags: string[];
}

export interface UserConfig {
	import_service_config?: { [service: string]: ImportOptions };
}

export type UserConfigResponse = { type: "success"; result: UserConfig } | { type: "error"; message: string };

class UserConfigService {
	static get(): Promise<UserConfigResponse> {
		return BooruRequest.runQueryJsonV2("/user/config");
	}

	static set(config: UserConfig): Promise<UserConfigResponse> {
		return BooruRequest.runQueryVersioned("v2", "/user/config?replace=true", "POST", config).then(v => v.json());
	}
}

export default UserConfigService;
