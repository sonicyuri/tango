/** @format */
import { ApiResponse } from "../ApiResponse";
import { BooruRequest } from "../BooruRequest";

class FavoriteService {
	static async getFavorites(): Promise<ApiResponse<string[]>> {
		return BooruRequest.queryResult<string[]>("/favorite/list");
	}

	static async setFavorite(
		postId: string,
		favorite: boolean
	): Promise<ApiResponse<string[]>> {
		return BooruRequest.queryResultAdvanced<string[]>(
			"/favorite/set",
			"POST",
			{
				post_id: postId,
				action: favorite ? "set" : "unset"
			}
		);
	}
}

export default FavoriteService;
