/** @format */

import { BooruRequest } from "../BooruRequest";

class TagService {
	static async getTags(): Promise<string[]> 
	{
		return BooruRequest.runQueryJson("/api/shimmie/get_tags").then(v => {
			return v as string[];
		});
	}
}

export default TagService;
