/** @format */
import {
	BooruTag,
	BooruTagCategory,
	ShimmieTagCategory
} from "../../models/BooruTag";
import { ApiResponse } from "../ApiResponse";
import { BooruRequest } from "../BooruRequest";

export interface TagListResponse {
	tags: BooruTag[];
	tagFrequencies: { [tag: string]: number };
	categories: BooruTagCategory[];
}

interface RawTagListResponse {
	tags: { [tag: string]: number };
	categories: ShimmieTagCategory[];
}

export interface TagInfoResponse {
	description: string;
}

class TagService {
	static async getTags(): Promise<ApiResponse<TagListResponse>> {
		return BooruRequest.queryResult<RawTagListResponse>("/tag/list").then(
			response =>
				response.map(val => ({
					tags: Object.keys(val.tags).map(
						t => new BooruTag(t, val.tags[t])
					),
					tagFrequencies: val.tags,
					categories: val.categories.map(c => new BooruTagCategory(c))
				}))
		);
	}

	static async getTagInfo(
		tag: string
	): Promise<ApiResponse<TagInfoResponse>> {
		return BooruRequest.queryResult<TagInfoResponse>(
			"/tag/info/" + encodeURIComponent(tag)
		);
	}

	static async setTagInfo(
		tag: string,
		newInfo: TagInfoResponse
	): Promise<ApiResponse<TagInfoResponse>> {
		return BooruRequest.queryResultAdvanced<TagInfoResponse>(
			`/tag/info/${encodeURIComponent(tag)}/edit`,
			"POST",
			newInfo
		);
	}
}

export default TagService;
