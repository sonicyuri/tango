/** @format */
import { BooruTag, BooruTagCategory, ShimmieTagCategory } from "../../models/BooruTag";
import { BooruRequest } from "../BooruRequest";

interface TagListResult {
	tags: {
		images: BooruTag[];
		videos: BooruTag[];
		vr: BooruTag[];
		all: BooruTag[];
	};
	categories: BooruTagCategory[];
}

type TagListResponse = { type: "success"; result: TagListResult } | { type: "error"; message: string };

export interface TagInfoResult {
	description: string;
}

type TagInfoResponse = { type: "success"; result: TagInfoResult } | { type: "error"; message: string };

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
					tags: {
						images: Object.keys(tags["images"]).map(t => new BooruTag(t, tags[t])),
						videos: Object.keys(tags["videos"]).map(t => new BooruTag(t, tags[t])),
						vr: Object.keys(tags["vr"]).map(t => new BooruTag(t, tags[t])),
						all: Object.keys(tags["all"]).map(t => new BooruTag(t, tags[t]))
					},
					categories: v.result.categories.map((c: ShimmieTagCategory) => new BooruTagCategory(c))
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
