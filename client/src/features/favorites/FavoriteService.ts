/** @format */
import { BooruRequest } from "../BooruRequest";

type FavoriteListResponse = { type: "success"; result: string[] } | { type: "error"; message: string };

class FavoriteService {
	static async getFavorites(): Promise<FavoriteListResponse> {
		return BooruRequest.runQueryJsonV2("/favorite/list").then(v => v as FavoriteListResponse);
	}

	static async setFavorite(postId: string, favorite: boolean): Promise<FavoriteListResponse> {
		return BooruRequest.runQueryVersioned("v2", "/favorite/set", "POST", {
			postId,
			action: favorite ? "set" : "unset"
		})
			.then(v => v.json())
			.then(v => v as FavoriteListResponse);
	}
}

export default FavoriteService;
