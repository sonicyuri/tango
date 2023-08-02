/** @format */

import { BooruTag, BooruTagCategory, ShimmieTagCategory } from "../../models/BooruTag";
import { BooruRequest } from "../BooruRequest";

interface TagListResponse
{
	tags: BooruTag[],
	categories: BooruTagCategory[]
}

class TagService {
	static async getTags(): Promise<TagListResponse> 
	{
		return BooruRequest.runQueryJson("/api/shimmie/get_tags_v2").then(v => {
			const tags = v["tags"];
			return {
				tags: Object.keys(tags).map(t => new BooruTag(t, tags[t])),
				categories: v["categories"].map((c: ShimmieTagCategory) => new BooruTagCategory(c))
			};
		});
	}
}

export default TagService;
