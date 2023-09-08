/** @format */
import { BooruTag, BooruTagCategory, ShimmieTagCategory } from "../../models/BooruTag";
import { BooruRequest } from "../BooruRequest";

interface TagListResult {
	tags: BooruTag[];
	categories: BooruTagCategory[];
}

type TagListResponse = { type: "success"; result: TagListResult } | { type: "error"; message: string };

class TagService {
	static async getTags(): Promise<TagListResponse> {
		return BooruRequest.runQueryJsonV2("/tag/list").then(v => {
			if (v.type == "error") {
				return v;
			}

			const tags = v.result.tags;
			return {
				type: "success",
				result: {
					tags: Object.keys(tags).map(t => new BooruTag(t, tags[t])),
					categories: v.result.categories.map((c: ShimmieTagCategory) => new BooruTagCategory(c))
				}
			};
		});
	}
}

export default TagService;
