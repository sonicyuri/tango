/** @format */
import { CaseReducer, createAsyncThunk, createSlice, PayloadAction, PayloadAction, Reducer } from "@reduxjs/toolkit";
import moment from "moment";
import { notify } from "reapop";

import { BooruTag, BooruTagCategory } from "../../models/BooruTag";
import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import TagService, { TagInfoResult } from "./TagService";

const logger: Logger = LogFactory.create("TagSlice");

const getNextRequestTime = () => moment().add(2, "minutes");

type TagInfoState = "initial" | "loading" | "failed" | "ready";

type TagInfoRequest = { state: TagInfoState; tag: string };

interface TagState {
	tags: BooruTag[];
	categories: BooruTagCategory[];
	tagFrequencies: { [tag: string]: number };
	nextTagRequest: moment.Moment;
	tagInfos: { [tag: string]: TagInfoResult };
	tagInfoLoadingStates: { [tag: string]: TagInfoState };
}

const setTagInfoStateReducer: CaseReducer<TagState, PayloadAction<TagInfoRequest>> = (state, action) => {
	state.tagInfoLoadingStates[action.payload.tag] = action.payload.state;
};

const setTagInfoState = (newState: TagInfoRequest): PayloadAction<TagInfoRequest> => ({
	type: "tag/setTagInfoState",
	payload: newState
});

export const tagList = createAsyncThunk("tag/list", async (_: null, thunkApi) => {
	try {
		const result = await TagService.getTags();
		if (result.type == "error") {
			logger.error("error listing tags", result.message);
			thunkApi.dispatch(notify("failed to obtain tags", "error"));
			return thunkApi.rejectWithValue({});
		}

		return result.result;
	} catch (error: any) {
		logger.error("error listing tags", error);
		thunkApi.dispatch(notify("failed to obtain tags", "error"));
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

export const tagInfoGet = createAsyncThunk("tag/get_info", async (tag: string, thunkApi) => {
	try {
		thunkApi.dispatch(setTagInfoState({ tag, state: "loading" }));

		const result = await TagService.getTagInfo(tag);
		if (result.type == "error") {
			logger.error("error getting tag info", result.message);
			thunkApi.dispatch(notify("failed to obtain tag info", "error"));
			return thunkApi.rejectWithValue({ tag });
		}

		return { tag, info: result.result };
	} catch (error: any) {
		logger.error("error getting tag info", error);
		thunkApi.dispatch(notify("failed to obtain tag info", "error"));
		return thunkApi.rejectWithValue({ tag });
	}
});

const initialState: TagState = {
	tags: [],
	tagFrequencies: {},
	categories: [],
	nextTagRequest: getNextRequestTime(),
	tagInfos: {},
	tagInfoLoadingStates: {}
};

export const TagSlice = createSlice({
	name: "tag",
	initialState,
	reducers: {
		setTagInfoState: setTagInfoStateReducer
	},
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
		builder.addCase(tagInfoGet.fulfilled, (state, action) => {
			state.tagInfos[action.payload.tag] = action.payload.info;
			state.tagInfoLoadingStates[action.payload.tag] = "ready";
		});
		builder.addCase(tagInfoGet.rejected, (state, action) => {
			state.tagInfoLoadingStates[(action.payload as any).tag] = "failed";
		});
	}
});

export default TagSlice.reducer as Reducer<TagState>;
export const selectTagState = (state: RootState) => state.tag;
