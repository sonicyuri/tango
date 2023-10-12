/** @format */
import { CaseReducer, createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { notify } from "reapop";

import { BooruPost } from "../../models/BooruPost";
import { PostSearchCursor } from "../PostSearchCursor";
import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import PostService, { PostDirectLinkRequest, PostGetRequest, PostListRequest, PostSetTagsRequest } from "./PostService";
import { tagUpdateEdit } from "../tags/TagSlice";

const logger: Logger = LogFactory.create("PostSlice");

type PostSearchState = "initial" | "loading" | "ready" | "failed";

type PostNavigateDirection = -1 | 1;

interface PostState {
	cursor: PostSearchCursor | null;
	searchState: PostSearchState;
	posts: BooruPost[];
	currentPost: BooruPost | null;
}

const setSearchState: CaseReducer<PostState, PayloadAction<PostSearchState>> = (state, action) => {
	state.searchState = action.payload;
};

const setSearchStateAction = (newState: PostSearchState): PayloadAction<PostSearchState> => ({
	type: "post/setSearchState",
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

		await PostService.setPostTags(request.post, request.tags);

		thunkApi.dispatch(
			tagUpdateEdit({ post: request.post, prevTags: request.post.tags, newTags: request.tags.split(" ") })
		);

		const post = await PostService.getPostById(request.post.id);

		return { post };
	} catch (error: any) {
		logger.error("error setting tags", error);
		thunkApi.dispatch(notify("Set tags failed - " + error, "error"));
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

const initialState: PostState = {
	cursor: null,
	searchState: "initial",
	posts: [],
	currentPost: null
};

export const PostSlice = createSlice({
	name: "post",
	initialState,
	reducers: {
		setSearchState
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
			if (state.currentPost?.id == action.payload.post?.id) {
				state.currentPost = action.payload.post;
			}

			if (action.payload.post != null) {
				state.cursor?.storeOrUpdatePost(action.payload.post);
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
	}
});

export default PostSlice.reducer;
export const selectPostState = (state: RootState) => state.post;
