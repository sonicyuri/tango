/** @format */
import {
	CaseReducer,
	createAsyncThunk,
	createSlice,
	PayloadAction
} from "@reduxjs/toolkit";
import { notify } from "reapop";

import { BooruPost, ShimmiePost } from "../../models/BooruPost";
import { LocalSettings } from "../../util/LocalSettings";
import { LogFactory, Logger } from "../../util/Logger";
import { Result } from "../../util/Result";
import { StaticUIErrorFactory, UIError } from "../../util/UIError";
import { AsyncValue, StoredAsyncValue } from "../AsyncValue";
import { PostSearchCursor } from "../PostSearchCursor";
import { RootState } from "../Store";
import { tagUpdateEdit } from "../tags/TagSlice";
import PostService, {
	PostDirectLinkRequest,
	PostGetRequest,
	PostListRequest,
	PostSetTagsRequest,
	PostUploadRequest,
	PostVotesMap,
	VoteRequest
} from "./PostService";
import { BooruPool } from "../../models/BooruPool";
import PoolService, { PoolListRequest } from "./PoolService";

const logger: Logger = LogFactory.create("PostSlice");
const errorFactory: StaticUIErrorFactory = new StaticUIErrorFactory(
	"PostSlice"
);

type PostSearchState = "initial" | "loading" | "ready" | "failed";
type PostUploadState = "initial" | "uploading" | "done" | "failed";
type PoolListState = "initial" | "loading" | "ready" | "failed";

const postVotesValue = new AsyncValue<PostVotesMap>("post", "votes", {});

type PostNavigateDirection = -1 | 1;

interface PostState {
	cursor: PostSearchCursor | null;
	searchState: PostSearchState;
	posts: BooruPost[];
	currentPost: BooruPost | null;
	votes: StoredAsyncValue<PostVotesMap>;
	uploadProgress: number;
	uploadState: PostUploadState;

	pools: BooruPool[];
	poolCount: number;
	currentPool: BooruPool | null;
	poolState: PoolListState;
}

const setSearchState: CaseReducer<PostState, PayloadAction<PostSearchState>> = (
	state,
	action
) => {
	state.searchState = action.payload;
};

const setSearchStateAction = (
	newState: PostSearchState
): PayloadAction<PostSearchState> => ({
	type: "post/setSearchState",
	payload: newState
});

const setUploadState: CaseReducer<PostState, PayloadAction<PostUploadState>> = (
	state,
	action
) => {
	state.uploadState = action.payload;
};

const setUploadStateAction = (
	newState: PostUploadState
): PayloadAction<PostUploadState> => ({
	type: "post/setUploadState",
	payload: newState
});

const setPoolState: CaseReducer<PostState, PayloadAction<PoolListState>> = (
	state,
	action
) => {
	state.poolState = action.payload;
};

const setPoolStateAction = (
	newState: PoolListState
): PayloadAction<PoolListState> => ({
	type: "post/setPoolState",
	payload: newState
});

const setUploadProgress: CaseReducer<PostState, PayloadAction<number>> = (
	state,
	action
) => {
	state.uploadProgress = action.payload;
};

const setUploadProgressAction = (newState: number): PayloadAction<number> => ({
	type: "post/setUploadProgress",
	payload: newState
});

const updatePostInState = (state: PostState, post: BooruPost) => {
	// TODO: move cursor to a more redux-y form so we don't have to do this
	// updating a post should be a new action
	state.cursor?.storeOrUpdatePost(post);
	if (state.posts.some(p => p.id === post.id)) {
		state.posts = state.posts.filter(p => p.id !== post.id).concat([post]);
	}
	if (state.currentPost?.id === post.id) {
		state.currentPost = post;
	}
};

// creates a cursor for the given request
export const postList = createAsyncThunk(
	"post/list",
	async (request: PostListRequest, thunkApi) => {
		try {
			thunkApi.dispatch(setSearchStateAction("loading"));

			const state: PostState = (thunkApi.getState() as any).post;
			let cursor = state.cursor;
			if (
				state.cursor != null &&
				state.cursor.currentQuery == request.query
			) {
				state.cursor.setOffset(request.offset);
			} else {
				cursor = new PostSearchCursor(
					request.query,
					LocalSettings.pageSize.value || 0,
					request.offset
				);
			}

			const posts = await cursor?.getPostsAtCursor();

			return {
				cursor,
				posts
			};
		} catch (error: any) {
			logger.error("error fetching posts", error);
			thunkApi.dispatch(notify("List posts failed - " + error, "error"));
			return thunkApi.rejectWithValue({});
		}
	}
);

export const postListRefresh = createAsyncThunk(
	"post/list_refresh",
	async (request: null, thunkApi) => {
		try {
			thunkApi.dispatch(setSearchStateAction("loading"));
			const state: PostState = (thunkApi.getState() as any).post;
			if (state.cursor == null) {
				return thunkApi.rejectWithValue({});
			}

			state.cursor.reload();
			const posts = await state.cursor.getPostsAtCursor();
			return { posts };
		} catch (error: any) {
			logger.error("error fetching posts", error);
			thunkApi.dispatch(notify("List posts failed - " + error, "error"));
			return thunkApi.rejectWithValue({});
		}
	}
);

export const postViewById = createAsyncThunk(
	"post/view_by_id",
	async (request: PostGetRequest, thunkApi) => {
		try {
			thunkApi.dispatch(setSearchStateAction("loading"));
			const state: PostState = (thunkApi.getState() as any).post;
			if (state.cursor == null) {
				return thunkApi.rejectWithValue({});
			}

			state.cursor.setCurrentPostById(request.postId);
			thunkApi.dispatch(postRecordView(request.postId));
			return { post: await state.cursor.getPostAtCursor() };
		} catch (error: any) {
			logger.error("error fetching post", error);
			thunkApi.dispatch(
				notify("View by id lookup failed - " + error, "error")
			);
			return thunkApi.rejectWithValue({});
		}
	}
);

export const postDirectLink = createAsyncThunk(
	"post/direct_link",
	async (request: PostDirectLinkRequest, thunkApi) => {
		try {
			thunkApi.dispatch(setSearchStateAction("loading"));
			const cursor = new PostSearchCursor(
				request.query,
				LocalSettings.pageSize.value || 0,
				request.offset || 0
			);

			await cursor.getPostsAtCursor();

			let post = cursor.getPostById(request.postId);

			if (!cursor.hasPost(request.postId)) {
				let response = await PostService.getPostById(request.postId);
				if (response.type == "error") {
					logger.error("error fetching post", response.message);
					thunkApi.dispatch(
						notify(
							"Direct link lookup failed - " + response.message,
							"error"
						)
					);
					return thunkApi.rejectWithValue({});
				}

				post = new BooruPost(response.result);

				await cursor.storeOrUpdatePost(post);
			}

			await cursor.setCurrentPostById(request.postId);
			thunkApi.dispatch(postRecordView(request.postId));

			const posts = await cursor.getPostsAtCursor();

			return {
				posts,
				post,
				cursor
			};
		} catch (error: any) {
			logger.error("error fetching post", error);
			thunkApi.dispatch(
				notify("Direct link lookup failed - " + error, "error")
			);
			return thunkApi.rejectWithValue({});
		}
	}
);

export const postSetTags = createAsyncThunk(
	"post/set_tags",
	async (request: PostSetTagsRequest, thunkApi) => {
		try {
			const state: PostState = (thunkApi.getState() as any).post;
			if (state.cursor == null) {
				return thunkApi.rejectWithValue({});
			}

			let result = await PostService.setPostTags(
				request.post,
				request.tags
			);
			if (result.type == "error") {
				logger.error("error setting tags", result.message);
				thunkApi.dispatch(
					notify("Failed to set tags: " + result.message, "error")
				);
				return thunkApi.rejectWithValue({});
			}

			thunkApi.dispatch(
				tagUpdateEdit({
					post: request.post,
					prevTags: request.post.tags,
					newTags: request.tags
				})
			);

			return new BooruPost(result.result);
		} catch (error: any) {
			logger.error("error setting tags", error);
			thunkApi.dispatch(notify("Failed to set tags: " + error, "error"));
			return thunkApi.rejectWithValue({});
		}
	}
);

export const postDownload = createAsyncThunk(
	"post/download",
	async (request: BooruPost, thunkApi) => {
		return fetch(request.contentUrl, { method: "GET" })
			.then(res => res.blob())
			.then(blob => {
				const a = document.createElement("a");
				a.href = window.URL.createObjectURL(blob);
				a.download = request.hash + "." + request.extension;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(a.href);
				document.body.removeChild(a);

				return null;
			});
	}
);

export const postListVotes = postVotesValue.addAsyncAction(
	"post/list_votes",
	(req: null) =>
		errorFactory.wrapErrorOnly(
			PostService.getVotes(),
			"modules.posts.errors.listVotes"
		)
);

export const postVote = postVotesValue.addAsyncAction<
	VoteRequest,
	PostState,
	{ post: ShimmiePost; score: number }
>(
	"post/vote",
	(req: VoteRequest) =>
		errorFactory.wrapError(
			PostService.vote(req),
			"modules.posts.errors.vote",
			post => {
				let score = 0;
				if (req.action == "up") {
					score = 1;
				} else if (req.action == "down") {
					score = -1;
				}

				return Result.successPromise({ post, score });
			}
		),
	(thisValue, state, payload) => {
		thisValue[payload.post.id] = payload.score;

		let currentPost = state.cursor?.getPostById(payload.post.id);
		if (currentPost != null) {
			currentPost.numericScore = payload.post.numeric_score;
			updatePostInState(state, currentPost);
		} else {
			return Result.failure(
				UIError.create(
					"Received vote response for non-existent post - huh?"
				)
			);
		}

		return Result.success(thisValue);
	}
);

export const postUpload = createAsyncThunk(
	"post/upload",
	async (req: PostUploadRequest, thunkApi) => {
		try {
			thunkApi.dispatch(setUploadStateAction("uploading"));
			thunkApi.dispatch(setUploadProgressAction(0.0));

			let result = await PostService.upload(req, progress =>
				thunkApi.dispatch(setUploadProgressAction(progress))
			);

			if (result.type == "error") {
				logger.error("error uploading post", result.message);
				thunkApi.dispatch(
					notify("Error uploading post: " + result.message, "error")
				);
				return thunkApi.rejectWithValue({});
			}

			return result.result;
		} catch (error: any) {
			logger.error("error uploading post", error);
			thunkApi.dispatch(notify("Error uploading post", "error"));
			return thunkApi.rejectWithValue({});
		}
	}
);

export const postRecordView = createAsyncThunk(
	"post/view",
	async (postId: string, thunkApi) => {
		const result = await PostService.view(postId);
		return result.matchPromise(
			success => Promise.resolve(postId),
			err => {
				logger.error("error recording post view", err);
				return Promise.reject("");
			}
		);
	}
);

// pool list
// we're putting this stuff in the post slice because it needs to access the cursor and i cba to think of a better solution
export const poolList = createAsyncThunk(
	"post/list_pools",
	async (request: PoolListRequest, thunkApi) => {
		try {
			thunkApi.dispatch(setPoolStateAction("loading"));

			return (await PoolService.getPools(request)).matchPromise(
				response => Promise.resolve(response),
				err => {
					logger.error("error fetching pools", err);
					thunkApi.dispatch(
						notify("List pools failed - " + err, "error")
					);
					return Promise.reject("");
				}
			);
		} catch (error: any) {
			logger.error("error fetching pools", error);
			thunkApi.dispatch(notify("List pools failed - " + error, "error"));
			return thunkApi.rejectWithValue({});
		}
	}
);

export const poolInfo = createAsyncThunk(
	"post/info_pools",
	async (poolId: string, thunkApi) => {
		try {
			thunkApi.dispatch(setPoolStateAction("loading"));

			return (await PoolService.getPool(poolId)).matchPromise(
				response => Promise.resolve(response),
				err => {
					logger.error("error fetching pool", err);
					thunkApi.dispatch(
						notify("Get pool failed - " + err, "error")
					);
					return Promise.reject("");
				}
			);
		} catch (error: any) {
			logger.error("error fetching pool", error);
			thunkApi.dispatch(notify("Get pool failed - " + error, "error"));
			return thunkApi.rejectWithValue({});
		}
	}
);

const initialState: PostState = {
	cursor: null,
	searchState: "initial",
	posts: [],
	currentPost: null,
	votes: postVotesValue.storedValue,
	uploadProgress: 0.0,
	uploadState: "initial",

	pools: [],
	poolCount: 0,
	currentPool: null,
	poolState: "initial"
};

export const PostSlice = createSlice({
	name: "post",
	initialState,
	reducers: {
		setSearchState,
		setUploadState,
		setUploadProgress
	},
	extraReducers: builder => {
		postVotesValue.setupReducers(builder);

		builder.addCase(postList.fulfilled, (state, action) => {
			state.cursor = action.payload.cursor;
			state.posts = action.payload.posts || [];
			state.searchState = "ready";
		});
		builder.addCase(postList.rejected, (state, action) => {
			state.cursor = null;
			state.posts = [];
			state.searchState = "failed";
		});

		builder.addCase(postListRefresh.fulfilled, (state, action) => {
			state.posts = action.payload.posts;
			state.searchState = "ready";
		});
		builder.addCase(postListRefresh.rejected, (state, action) => {
			state.searchState = "failed";
		});

		builder.addCase(postDirectLink.fulfilled, (state, action) => {
			state.currentPost = action.payload.post;
			state.posts = action.payload.posts;
			state.cursor = action.payload.cursor;
			state.searchState = "ready";

			if (state.currentPost != null) {
				state.currentPost.views++;
				state.cursor?.storeOrUpdatePost(state.currentPost);
			}
		});
		builder.addCase(postDirectLink.rejected, (state, action) => {
			state.currentPost = null;
			state.posts = [];
			state.cursor = null;
			state.searchState = "failed";
		});

		builder.addCase(postSetTags.fulfilled, (state, action) => {
			if (state.currentPost?.id == action.payload.id) {
				state.currentPost = action.payload;
			}

			if (action.payload != null) {
				state.cursor?.storeOrUpdatePost(action.payload);
			}
		});
		builder.addCase(postSetTags.rejected, (state, action) => {});

		builder.addCase(postViewById.fulfilled, (state, action) => {
			state.currentPost = action.payload.post;
			if (state.currentPost) {
				state.currentPost.views++;
			}
			state.searchState = "ready";
		});
		builder.addCase(postViewById.rejected, (state, action) => {
			state.searchState = "failed";
		});
		builder.addCase(postDownload.fulfilled, (state, action) => {});
		builder.addCase(postDownload.rejected, (state, action) => {});

		builder.addCase(postUpload.fulfilled, (state, action) => {
			state.uploadState = "done";
			state.uploadProgress = 1.0;
			Object.keys(action.payload.posts).forEach(k => {
				let post = action.payload.posts[k];
				state.cursor?.storeOrUpdatePost(new BooruPost(post));
			});
		});

		builder.addCase(postUpload.rejected, (state, action) => {
			state.uploadState = "failed";
			state.uploadProgress = 0.0;
		});

		builder.addCase(postRecordView.fulfilled, (state, action) => {});
		builder.addCase(postRecordView.rejected, (state, action) => {});

		builder.addCase(poolList.fulfilled, (state, action) => {
			state.poolState = "ready";
			state.poolCount = action.payload.count;
			state.pools = action.payload.pools;
		});
		builder.addCase(poolList.rejected, (state, action) => {
			state.poolState = "failed";
		});

		builder.addCase(poolInfo.fulfilled, (state, action) => {
			state.poolState = "ready";
			state.currentPool = action.payload;
			action.payload.posts.forEach(p => {
				state.cursor?.storeOrUpdatePost(p);
			});
		});
		builder.addCase(poolInfo.rejected, (state, action) => {
			state.poolState = "failed";
		});
	}
});

export default PostSlice.reducer;
export const selectPostState = (state: RootState) => state.post;
