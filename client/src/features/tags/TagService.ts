/** @format */
import { BooruTag, BooruTagCategory, ShimmieTagCategory } from "../../models/BooruTag";
import { BooruRequest } from "../BooruRequest";

interface TagListResult {
	tags: { [tag: string]: number };
	categories: BooruTagCategory[];
}

type TagListResponse = { type: "success"; result: TagListResult } | { type: "error"; message: string };

export interface TagInfoResult {
	description: string;
}

type TagInfoResponse = { type: "success"; result: TagInfoResult } | { type: "error"; message: string };

class TagService {
	static async getTags(): Promise<TagListResponse> {
		return BooruRequest.runQueryJson("/api/shimmie/get_tags_v2").then(v => {
			if (v.type == "error") {
				return v;
			}

			const tags = v.tags;
			return {
				type: "success",
				result: {
					tags,
					categories: v.categories.map((c: ShimmieTagCategory) => new BooruTagCategory(c))
				}
			};
		});
	}

	static async getTagInfo(tag: string): Promise<TagInfoResponse> {
		return BooruRequest.runQueryJsonV2("/tag/info/" + encodeURIComponent(tag));
	}

	static async setTagInfo(tag: string, newInfo: TagInfoResult): Promise<TagInfoResponse> {
		return BooruRequest.runQueryVersioned("v2", `/tag/info/${encodeURIComponent(tag)}/edit`, "POST", newInfo).then(
			v => v.json()
		);
	}
}

export default TagService;
