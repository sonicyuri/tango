/** @format */
import { createAsyncThunk, createSlice, Reducer } from "@reduxjs/toolkit";
import moment from "moment";

import { BooruTag, BooruTagCategory } from "../../models/BooruTag";
import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import TagService from "./TagService";

const logger: Logger = LogFactory.create("TagSlice");

const getNextRequestTime = () => moment().add(2, "minutes");

interface TagState {
	tags: BooruTag[];
	categories: BooruTagCategory[];
	tagFrequencies: { [tag: string]: number };
	nextTagRequest: moment.Moment;
}

export const tagList = createAsyncThunk("tag/list", async (_: null, thunkApi) => {
	try {
		return await TagService.getTags();
	} catch (error: any) {
		logger.error("error listing tags", error);
		return thunkApi.rejectWithValue({});
	}
});

interface TagUpdateEditRequest {
	prevTags: string[];
	newTags: string[];
}

export const tagUpdateEdit = createAsyncThunk("tag/update_edit", async (req: TagUpdateEditRequest, thunkApi) => {
	const state: TagState = (thunkApi.getState() as any).tag;

	if (moment().isAfter(state.nextTagRequest)) {
		thunkApi.dispatch(tagList(null));
		return { prevTags: [], newTags: [] };
	}

	return req;
});

const initialState: TagState = {
	tags: [],
	tagFrequencies: {},
	categories: [],
	nextTagRequest: getNextRequestTime()
};

export const TagSlice = createSlice({
	name: "tag",
	initialState,
	reducers: {},
	extraReducers: builder => {
		builder.addCase(tagList.fulfilled, (state, action) => {
			state.tags = action.payload.tags.sort((a, b) => b.frequency - a.frequency);
			state.categories = action.payload.categories;
			state.tagFrequencies = {};
			state.nextTagRequest = getNextRequestTime();
			state.tags.forEach(t => (state.tagFrequencies[t.tag] = t.frequency));
		});
		builder.addCase(tagList.rejected, (state, action) => {});
		builder.addCase(tagUpdateEdit.fulfilled, (state, action) => {
			action.payload.prevTags.forEach(t => state.tagFrequencies[t]--);
			action.payload.newTags.forEach(t => state.tagFrequencies[t]++);
		});
		builder.addCase(tagUpdateEdit.rejected, (state, action) => {});
	}
});

export default TagSlice.reducer as Reducer<TagState>;
export const selectTagState = (state: RootState) => state.tag;
