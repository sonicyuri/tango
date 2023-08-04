/** @format */

import { BooruPost, ShimmiePost } from "../../models/BooruPost";
import { BooruRequest } from "../BooruRequest";

export interface PostListRequest {
	query: string | null;
	page: number;
}

export interface PostGetRequest {
	postId: string;
}

export interface PostGetByIdRequest {
	postId: string;
}

// the request that needs to be made by a direct link to an ImagePage to bring it up to speed
export interface PostDirectLinkRequest {
	postId: string;
	query: string | null;
	page: number | null;
}

export interface PostSetTagsRequest {
	post: BooruPost;
	tags: string;
}

class PostService {
	static async getPostById(id: string): Promise<BooruPost | null> {
		return BooruRequest.runQueryJson("/api/shimmie/get_image/" + id).then(v => {
			if (Object.keys(v).length == 0) {
				return null;
			}

			return new BooruPost(v as ShimmiePost);
		});
	}

	static setPostTags(post: BooruPost, newTags: string): Promise<void> {
		const data = new URLSearchParams();
		data.append("postId", post.id);
		data.append("tags", newTags);

		return BooruRequest.runQuery("/api/shimmie/set_tags", "POST", data)
			.then(res => res.json())
			.then(res => {
				if (res["result"] === "success") {
					return Promise.resolve();
				}

				return Promise.reject(new Error(res["message"]));
			});
	}
}

export default PostService;
