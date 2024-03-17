/** @format */

import { ApiResponse } from "../ApiResponse";
import { BooruRequest } from "../BooruRequest";

export interface ImportOptions {
	mappings: { [tag: string]: string };
	deleted_tags: string[];
}

export interface UserConfig {
	import_service_config?: { [service: string]: ImportOptions };
}

class UserConfigService {
	static get(): Promise<ApiResponse<UserConfig>> {
		return BooruRequest.queryResult("/user/config");
	}

	static set(config: UserConfig): Promise<ApiResponse<UserConfig>> {
		return BooruRequest.queryResultAdvanced(
			"/user/config?replace=true",
			"POST",
			config
		);
	}
}

export default UserConfigService;
