/** @format */

import { ShimmiePool } from "../../models/BooruPool";
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

export type PostUploadFile = { type: "url"; value: string } | { type: "file"; value: File };

export interface PostUploadPool {
	title: string;
	description: string;
	private: boolean;
}

export interface PostUploadRequest {
	files: PostUploadFile[];
	tags: string[];
	pool?: PostUploadPool;
}

export interface PostUploadResult {
	pool: ShimmiePool;
	posts: { [hash: string]: ShimmiePost };
}

export type PostUploadResponse = { type: "success"; result: PostUploadResult } | { type: "error"; message: string };

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

	static upload(req: PostUploadRequest, progressCallback: (progress: number) => void): Promise<PostUploadResponse> {
		const form = new FormData();

		let posts: {
			tags: string[];
			file: string;
			upload_type: "url" | "file";
			filename: string;
			pool_index: number;
		}[] = [];
		req.files.forEach((f, i) => {
			if (f.type == "file") {
				form.append("file" + i, f.value);
			}

			let filename = "";
			if (f.type == "file") {
				filename = f.value.name;
			} else {
				let url = new URL(f.value);
				let parts = url.pathname.split("/");
				filename = parts.length > 0 ? parts[parts.length - 1] : "file";
			}

			posts.push({
				tags: req.tags,
				file: f.type == "url" ? f.value : "file" + i,
				upload_type: f.type,
				filename,
				pool_index: i
			});
		});

		const request = {
			posts,
			pool: req.pool
		};

		form.append("data", JSON.stringify(request));

		return BooruRequest.runUploadQuery("/post/new", form, progressCallback);
	}
}

export default PostService;
