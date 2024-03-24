/** @format */
import { ApiResponse } from "../ApiResponse";
import { BooruRequest } from "../BooruRequest";

export type TagAliasListResponse = { [oldTag: string]: string };

class TagAliasService {
	static async getTagAliases(): Promise<ApiResponse<TagAliasListResponse>> {
		return BooruRequest.queryResult<TagAliasListResponse>(
			"/tag/alias/list"
		);
	}
}

export default TagAliasService;
