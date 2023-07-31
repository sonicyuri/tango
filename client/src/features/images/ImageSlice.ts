/** @format */

import { createSlice, createAsyncThunk, CaseReducer, PayloadAction } from "@reduxjs/toolkit";
import { notify } from "reapop";
import { CredentialsInvalidError } from "../BooruRequest";
import { BooruImage } from "../../models/BooruImage";
import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import { ImageSearchCursor } from "../../ImageSearchCursor";

import ImageService, {
	ImageSearchRequest as ImageListRequest,
	ImageGetByIdRequest,
	ImageGetRequest
} from "./ImageService";

const logger: Logger = LogFactory.create("ImageSlice");

type ImageSearchState = "initial" | "loading" | "ready" | "failed";

type ImageNavigateDirection = -1 | 1;

interface ImageState {
	cursor: ImageSearchCursor | null;
	searchState: ImageSearchState;
	images: BooruImage[];
	currentImage: BooruImage | null;
}

const setSearchState: CaseReducer<ImageState, PayloadAction<ImageSearchState>> = (state, action) => {
	state.searchState = action.payload;
};

const setSearchStateAction = (newState: ImageSearchState): PayloadAction<ImageSearchState> => ({
	type: "image/setSearchState",
	payload: newState
});

// creates a cursor for the given request
export const imageList = createAsyncThunk("image/list", async (request: ImageListRequest, thunkApi) => {
	try 
	{
		thunkApi.dispatch(setSearchStateAction("loading"));

		const cursor = new ImageSearchCursor(request.query);
		cursor.setCursorPosition(request.page, 0);
		const images = await cursor.getImagesAtCursor();

		return {
			cursor,
			images
		};
	} 
	catch (error: any) 
	{
		logger.error("error fetching images", error);
		thunkApi.dispatch(notify("List images failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const imageSetPage = createAsyncThunk("image/set_page", async (page: number, thunkApi) => {
	try 
	{
		const state: ImageState = (thunkApi.getState() as any).image;
		if (state.cursor == null) 
		{
			return thunkApi.rejectWithValue({});
		}

		state.cursor.setCursorPosition(page, 0);

		thunkApi.dispatch(setSearchStateAction("loading"));
		const images = await state.cursor.getImagesAtCursor();
		return {
			images
		};
	} 
	catch (error: any) 
	{
		logger.error("error setting page", error);
		thunkApi.dispatch(notify("Set page failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

const imageGetReducer: CaseReducer<ImageState, PayloadAction<ImageGetRequest>> = (state, action) => {
	if (state.cursor != null) 
	{
		state.cursor.setCursorIndex(action.payload.pageIndex);
	}

	state.currentImage = action.payload.image;
	state.searchState = "ready";
};

export const imageGet = (request: ImageGetRequest): PayloadAction<ImageGetRequest> => ({
	type: "image/get",
	payload: request
});

export const imageGetById = createAsyncThunk("image/view_by_id", async (request: ImageGetByIdRequest, thunkApi) => {
	try 
	{
		thunkApi.dispatch(setSearchStateAction("loading"));

		return await ImageService.getImageById(request.imageId);
	} 
	catch (error: any) 
	{
		logger.error("error fetching image", error);
		thunkApi.dispatch(notify("View image failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

const initialState: ImageState = {
	cursor: null,
	searchState: "initial",
	images: [],
	currentImage: null
};

export const ImageSlice = createSlice({
	name: "image",
	initialState,
	reducers: {
		setSearchState,
		get: imageGetReducer
	},
	extraReducers: builder => {
		builder.addCase(imageList.fulfilled, (state, action) => {
			state.cursor = action.payload.cursor;
			state.images = action.payload.images;
			state.searchState = "ready";
		});
		builder.addCase(imageList.rejected, (state, action) => {
			state.cursor = null;
			state.images = [];
			state.searchState = "failed";
		});

		builder.addCase(imageGetById.fulfilled, (state, action) => {
			state.currentImage = action.payload;
			state.searchState = "ready";
		});
		builder.addCase(imageGetById.rejected, (state, action) => {
			state.currentImage = null;
			state.searchState = "failed";
		});

		builder.addCase(imageSetPage.fulfilled, (state, action) => {
			state.images = action.payload.images;
			state.searchState = "ready";
		});

		builder.addCase(imageSetPage.rejected, (state, action) => {
			state.images = [];
			state.searchState = "failed";
		});
	}
});

export default ImageSlice.reducer;
export const selectImageState = (state: RootState) => state.image;
