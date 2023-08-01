/** @format */

import { createSlice, createAsyncThunk, CaseReducer, PayloadAction } from "@reduxjs/toolkit";
import { notify } from "reapop";
import { CredentialsInvalidError } from "../BooruRequest";
import { BooruImage } from "../../models/BooruImage";
import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import { ImageSearchCursor } from "../../ImageSearchCursor";

import ImageService, {
	ImageListRequest,
	ImageDirectLinkRequest,
	ImageGetRequest,
	ImageSetTagsRequest
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

export const imageDirectLink = createAsyncThunk("image/direct_link", async (request: ImageDirectLinkRequest, thunkApi) => {
	try 
	{
		thunkApi.dispatch(setSearchStateAction("loading"));
		const cursor = new ImageSearchCursor(request.query);
		cursor.setCursorPosition(request.page || 1, 0);

		const images = await cursor.getImagesAtCursor();

		// if we have context we've probably already loaded the image info from the above query
		// if not, do another lookup for it
		let thisImage: BooruImage | null = null;
		for (let i = 0; i < images.length; i++)
		{
			if (images[i].id == request.imageId)
			{
				thisImage = images[i];
				// make sure we set the correct cursor position for navigation
				cursor.setCursorPosition(request.page || 1, i);
				break;
			}
		}

		return {
			images,
			image: thisImage || await ImageService.getImageById(request.imageId),
			cursor
		};
	} 
	catch (error: any) 
	{
		logger.error("error fetching image", error);
		thunkApi.dispatch(notify("Direct link lookup failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const imageNavigate = createAsyncThunk("image/navigate", async (request: ImageNavigateDirection, thunkApi) =>
{
	try 
	{
		const state: ImageState = (thunkApi.getState() as any).image;
		if (state.cursor == null) 
		{
			return thunkApi.rejectWithValue({});
		}

		if (!state.cursor.canMove(request))
		{
			return thunkApi.fulfillWithValue({ image: state.currentImage });
		}

		thunkApi.dispatch(setSearchStateAction("loading"));

		let image = await state.cursor.moveCursorAndReturn(request);
		return { image };
	} 
	catch (error: any) 
	{
		logger.error("error navigating", error);
		thunkApi.dispatch(notify("Navigate failed - " + error, "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const imageSetTags = createAsyncThunk("image/set_tags", async (request: ImageSetTagsRequest, thunkApi) =>
{
	try 
	{
		await ImageService.setImageTags(request.image, request.tags);
		const image = await ImageService.getImageById(request.image.id);

		return { image };
	} 
	catch (error: any) 
	{
		logger.error("error setting tags", error);
		thunkApi.dispatch(notify("Set tags failed - " + error, "error"));
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

		builder.addCase(imageDirectLink.fulfilled, (state, action) => {
			state.currentImage = action.payload.image;
			state.images = action.payload.images;
			state.cursor = action.payload.cursor;
			state.searchState = "ready";

			if (action.payload.image != null)
			{
				state.cursor?.storeOrUpdateImage(action.payload.image);
			}
		});
		builder.addCase(imageDirectLink.rejected, (state, action) => {
			state.currentImage = null;
			state.images = [];
			state.cursor = null;
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

		builder.addCase(imageNavigate.fulfilled, (state, action) => {
			state.currentImage = action.payload.image;
			state.searchState = "ready";
		});
		builder.addCase(imageNavigate.rejected, (state, action) => {
			state.currentImage = null;
			state.searchState = "failed";
		});

		builder.addCase(imageSetTags.fulfilled, (state, action) => {
			if (state.currentImage?.id == action.payload.image?.id)
			{
				state.currentImage = action.payload.image;
			}

			if (action.payload.image != null)
			{ 
				state.cursor?.storeOrUpdateImage(action.payload.image);
			}
		});
		builder.addCase(imageSetTags.rejected, (state, action) =>
		{
			
		});
	}
});

export default ImageSlice.reducer;
export const selectImageState = (state: RootState) => state.image;
