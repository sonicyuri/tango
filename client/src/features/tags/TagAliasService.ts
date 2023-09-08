/** @format */
import { BooruTag, BooruTagCategory, ShimmieTagCategory } from "../../models/BooruTag";
import { BooruRequest } from "../BooruRequest";

type TagAliasListResponse =
	| { type: "success"; result: { [oldTag: string]: string } }
	| { type: "error"; message: string };

class TagAliasService {
	static async getTagAliases(): Promise<TagAliasListResponse> {
		return BooruRequest.runQueryJsonV2("/tag/alias/list");
	}
}

export default TagAliasService;
