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
	tags: string[];
}

export type PostSetTagsResponse = { type: "success"; result: ShimmiePost } | { type: "error"; message: string };

export interface VoteRequest {
	post_id: string;
	action: "up" | "down" | "clear";
}

export type ListVoteResponse =
	| { type: "success"; result: { [score: number]: string[] } }
	| { type: "error"; message: string };

export type VoteResponse = { type: "success"; result: ShimmiePost } | { type: "error"; message: string };

export type PostInfoResponse = { type: "success"; result: ShimmiePost } | { type: "error"; message: string };

class PostService {
	static async getPostById(id: string): Promise<PostInfoResponse> {
		return BooruRequest.runQueryJsonV2("/post/info?id=" + id).then(v => {
			return v as PostInfoResponse;
		});
	}

	static setPostTags(post: BooruPost, newTags: string[]): Promise<PostSetTagsResponse> {
		return BooruRequest.runQueryVersioned("v2", "/post/edit", "POST", { post_id: post.id, tags: newTags }).then(
			res => res.json()
		);
	}

	static getVotes(): Promise<ListVoteResponse> {
		return BooruRequest.runQueryJsonV2("/post/vote");
	}

	static vote(req: VoteRequest): Promise<VoteResponse> {
		return BooruRequest.runQueryVersioned("v2", "/post/vote", "POST", req).then(v => v.json());
	}
}

export default PostService;
