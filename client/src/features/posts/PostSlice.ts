/** @format */
import { CaseReducer, createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { notify } from "reapop";

import { BooruPost } from "../../models/BooruPost";
import { PostSearchCursor } from "../PostSearchCursor";
import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import PostService, { PostDirectLinkRequest, PostGetRequest, PostListRequest, PostSetTagsRequest } from "./PostService";

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

		const cursor = new PostSearchCursor(request.query);
		cursor.setCursorPosition(request.page, 0);
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

export const postSetPage = createAsyncThunk("post/set_page", async (page: number, thunkApi) => {
	try {
		const state: PostState = (thunkApi.getState() as any).post;
		if (state.cursor == null) {
			return thunkApi.rejectWithValue({});
		}

		state.cursor.setCursorPosition(page, 0);

		thunkApi.dispatch(setSearchStateAction("loading"));
		const posts = await state.cursor.getPostsAtCursor();
		return {
			posts
		};
	} catch (error: any) {
		logger.error("error setting page", error);
		thunkApi.dispatch(notify("Set page failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

const postGetReducer: CaseReducer<PostState, PayloadAction<PostGetRequest>> = (state, action) => {
	if (state.cursor != null) {
		state.cursor.setCursorIndex(action.payload.pageIndex);
	}

	state.currentPost = action.payload.post;
	state.searchState = "ready";
};

export const postGet = (request: PostGetRequest): PayloadAction<PostGetRequest> => ({
	type: "post/get",
	payload: request
});

export const postDirectLink = createAsyncThunk("post/direct_link", async (request: PostDirectLinkRequest, thunkApi) => {
	try {
		thunkApi.dispatch(setSearchStateAction("loading"));
		const cursor = new PostSearchCursor(request.query);
		cursor.setCursorPosition(request.page || 1, 0);

		const posts = await cursor.getPostsAtCursor();

		// if we have context we've probably already loaded the image info from the above query
		// if not, do another lookup for it
		let thisImage: BooruPost | null = null;
		for (let i = 0; i < posts.length; i++) {
			if (posts[i].id == request.postId) {
				thisImage = posts[i];
				// make sure we set the correct cursor position for navigation
				cursor.setCursorPosition(request.page || 1, i);
				break;
			}
		}

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

export const postNavigate = createAsyncThunk("image/navigate", async (request: PostNavigateDirection, thunkApi) => {
	try {
		const state: PostState = (thunkApi.getState() as any).post;
		if (state.cursor == null) {
			return thunkApi.rejectWithValue({});
		}

		if (!state.cursor.canMove(request)) {
			return { post: state.currentPost };
		}

		thunkApi.dispatch(setSearchStateAction("loading"));

		const post: BooruPost | null = await state.cursor.moveCursorAndReturn(request);
		return { post };
	} catch (error: any) {
		logger.error("error navigating", error);
		thunkApi.dispatch(notify("Navigate failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const postSetTags = createAsyncThunk("post/set_tags", async (request: PostSetTagsRequest, thunkApi) => {
	try {
		await PostService.setPostTags(request.post, request.tags);
		const post = await PostService.getPostById(request.post.id);

		return { post };
	} catch (error: any) {
		logger.error("error setting tags", error);
		thunkApi.dispatch(notify("Set tags failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
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
		setSearchState,
		get: postGetReducer
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

		builder.addCase(postSetPage.fulfilled, (state, action) => {
			state.posts = action.payload.posts;
			state.searchState = "ready";
		});

		builder.addCase(postSetPage.rejected, (state, action) => {
			state.posts = [];
			state.searchState = "failed";
		});

		builder.addCase(postNavigate.fulfilled, (state, action) => {
			state.currentPost = action.payload.post;
			state.searchState = "ready";
		});
		builder.addCase(postNavigate.rejected, (state, action) => {
			state.currentPost = null;
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
	}
});

export default PostSlice.reducer;
export const selectPostState = (state: RootState) => state.post;
