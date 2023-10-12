/** @format */
import { BooruRequest } from "../BooruRequest";

type FavoriteListResponse = { type: "success"; result: string[] } | { type: "error"; message: string };

class FavoriteService {
	static async getFavorites(): Promise<FavoriteListResponse> {
		return BooruRequest.runQueryJsonV2("/favorites/list").then(v => v as FavoriteListResponse);
	}

	static async setFavorite(postId: string, favorite: boolean): Promise<FavoriteListResponse> {
		const p = new URLSearchParams();
		p.append("postId", postId);
		p.append("action", favorite ? "set" : "unset");
		return BooruRequest.runQuery("/api/shimmie/set_favorite", "POST", p)
			.then(v => v.json())
			.then(v => v as FavoriteListResponse);
	}
}

export default FavoriteService;
