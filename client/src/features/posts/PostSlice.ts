/** @format */
import { CaseReducer, createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { notify } from "reapop";

import { BooruPost } from "../../models/BooruPost";
import { PostSearchCursor } from "../PostSearchCursor";
import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import PostService, {
	PostDirectLinkRequest,
	PostGetRequest,
	PostListRequest,
	PostSetTagsRequest,
	VoteRequest
} from "./PostService";
import { tagUpdateEdit } from "../tags/TagSlice";
import thunk from "redux-thunk";

const logger: Logger = LogFactory.create("PostSlice");

type PostSearchState = "initial" | "loading" | "ready" | "failed";
type PostVoteState = "initial" | "loading" | "ready";

type PostNavigateDirection = -1 | 1;

interface PostState {
	cursor: PostSearchCursor | null;
	searchState: PostSearchState;
	posts: BooruPost[];
	currentPost: BooruPost | null;
	votes: { [image_id: string]: number };
	voteState: PostVoteState;
}

const setSearchState: CaseReducer<PostState, PayloadAction<PostSearchState>> = (state, action) => {
	state.searchState = action.payload;
};

const setSearchStateAction = (newState: PostSearchState): PayloadAction<PostSearchState> => ({
	type: "post/setSearchState",
	payload: newState
});

const setVoteState: CaseReducer<PostState, PayloadAction<PostVoteState>> = (state, action) => {
	state.voteState = action.payload;
};

const setVoteStateAction = (newState: PostVoteState): PayloadAction<PostVoteState> => ({
	type: "post/setVoteState",
	payload: newState
});

// creates a cursor for the given request
export const postList = createAsyncThunk("post/list", async (request: PostListRequest, thunkApi) => {
	try {
		thunkApi.dispatch(setSearchStateAction("loading"));

		const cursor = new PostSearchCursor(request.query, request.page, 0);
		const posts = await cursor.getPostsAtCursor();

		return {
			cursor,
			posts
		};
	} catch (error: any) {
		logger.error("error fetching posts", error);
		thunkApi.dispatch(notify("List posts failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const postListRefresh = createAsyncThunk("post/list_refresh", async (request: null, thunkApi) => {
	try {
		thunkApi.dispatch(setSearchStateAction("loading"));
		const state: PostState = (thunkApi.getState() as any).post;
		if (state.cursor == null) {
			return thunkApi.rejectWithValue({});
		}

		state.cursor.preload;
		const posts = await state.cursor.getPostsAtCursor();
		return { posts };
	} catch (error: any) {
		logger.error("error fetching posts", error);
		thunkApi.dispatch(notify("List posts failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const postViewById = createAsyncThunk("post/view_by_id", async (request: PostGetRequest, thunkApi) => {
	try {
		thunkApi.dispatch(setSearchStateAction("loading"));
		const state: PostState = (thunkApi.getState() as any).post;
		if (state.cursor == null) {
			return thunkApi.rejectWithValue({});
		}

		state.cursor.setCurrentPostById(request.postId);
		return { post: await state.cursor.getPostAtCursor() };
	} catch (error: any) {
		logger.error("error fetching post", error);
		thunkApi.dispatch(notify("View by id lookup failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const postDirectLink = createAsyncThunk("post/direct_link", async (request: PostDirectLinkRequest, thunkApi) => {
	try {
		thunkApi.dispatch(setSearchStateAction("loading"));
		const cursor = new PostSearchCursor(request.query, request.page || 1);

		await cursor.loadAndSetCurrentPostById(request.postId);

		const posts = await cursor.getPostsAtCursor();

		// if we have context we've probably already loaded the image info from the above query
		// if not, do another lookup for it
		let thisImage: BooruPost = await cursor.getPostAtCursor();

		return {
			posts,
			post: thisImage || (await PostService.getPostById(request.postId)),
			cursor
		};
	} catch (error: any) {
		logger.error("error fetching post", error);
		thunkApi.dispatch(notify("Direct link lookup failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const postSetTags = createAsyncThunk("post/set_tags", async (request: PostSetTagsRequest, thunkApi) => {
	try {
		const state: PostState = (thunkApi.getState() as any).post;
		if (state.cursor == null) {
			return thunkApi.rejectWithValue({});
		}

		let result = await PostService.setPostTags(request.post, request.tags);
		if (result.type == "error") {
			logger.error("error setting tags", result.message);
			thunkApi.dispatch(notify("Failed to set tags: " + result.message, "error"));
			return thunkApi.rejectWithValue({});
		}

		thunkApi.dispatch(tagUpdateEdit({ post: request.post, prevTags: request.post.tags, newTags: request.tags }));

		return new BooruPost(result.result);
	} catch (error: any) {
		logger.error("error setting tags", error);
		thunkApi.dispatch(notify("Failed to set tags: " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const postDownload = createAsyncThunk("post/download", async (request: BooruPost, thunkApi) => {
	return fetch(request.videoUrl, { method: "GET" })
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
});

export const postListVotes = createAsyncThunk("post/list_votes", async (req: null, thunkApi) => {
	try {
		thunkApi.dispatch(setVoteStateAction("loading"));

		let result = await PostService.getVotes();
		if (result.type == "error") {
			logger.error("error fetching votes", result.message);
			thunkApi.dispatch(notify("Error fetching user votes: " + result.message, "error"));
			return thunkApi.rejectWithValue({});
		}

		return result.result;
	} catch (error: any) {
		logger.error("error fetching votes", error);
		thunkApi.dispatch(notify("Error fetching user votes", "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const postVote = createAsyncThunk("post/vote", async (req: VoteRequest, thunkApi) => {
	try {
		thunkApi.dispatch(setVoteStateAction("loading"));

		let result = await PostService.vote(req);
		if (result.type == "error") {
			logger.error("error making vote", result.message);
			thunkApi.dispatch(notify("Error making vote on post: " + result.message, "error"));
			return thunkApi.rejectWithValue({});
		}

		let score = 0;
		if (req.action == "up") {
			score = 1;
		} else if (req.action == "down") {
			score = -1;
		}

		return { post: result.result, score };
	} catch (error: any) {
		logger.error("error making vote", error);
		thunkApi.dispatch(notify("Error making vote on post", "error"));
		return thunkApi.rejectWithValue({});
	}
});

const initialState: PostState = {
	cursor: null,
	searchState: "initial",
	posts: [],
	currentPost: null,
	votes: {},
	voteState: "initial"
};

export const PostSlice = createSlice({
	name: "post",
	initialState,
	reducers: {
		setSearchState,
		setVoteState
	},
	extraReducers: builder => {
		builder.addCase(postList.fulfilled, (state, action) => {
			state.cursor = action.payload.cursor;
			state.posts = action.payload.posts;
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

			if (action.payload.post != null) {
				state.cursor?.storeOrUpdatePost(action.payload.post);
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
			state.searchState = "ready";
		});
		builder.addCase(postViewById.rejected, (state, action) => {
			state.searchState = "failed";
		});
		builder.addCase(postDownload.fulfilled, (state, action) => {});
		builder.addCase(postDownload.rejected, (state, action) => {});

		builder.addCase(postListVotes.fulfilled, (state, action) => {
			state.votes = {};
			Object.keys(action.payload).forEach(k => {
				let score = Number(k);
				action.payload[score].forEach(v => (state.votes[v] = score));
			});
			state.voteState = "ready";
		});
		builder.addCase(postListVotes.rejected, (state, action) => {});

		builder.addCase(postVote.fulfilled, (state, action) => {
			state.votes[action.payload.post.id] = action.payload.score;
			state.cursor?.updatePostScore(new BooruPost(action.payload.post));
			if (state.currentPost?.id == action.payload.post.id) {
				state.currentPost.numericScore = action.payload.post.numeric_score;
			}
			state.voteState = "ready";
		});
		builder.addCase(postVote.rejected, (state, action) => {});
	}
});

export default PostSlice.reducer;
export const selectPostState = (state: RootState) => state.post;
