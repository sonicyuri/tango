/** @format */
import { CaseReducer, createAsyncThunk, createSlice, PayloadAction, Reducer } from "@reduxjs/toolkit";
import moment from "moment";
import { notify } from "reapop";
import { BooruPost } from "../../models/BooruPost";

import { BooruTag, BooruTagCategory } from "../../models/BooruTag";
import { LogFactory, Logger } from "../../util/Logger";
import { Util } from "../../util/Util";
import { SearchFilterOptions } from "../SearchFilterOptions";
import { RootState } from "../Store";
import TagService, { TagInfoResult } from "./TagService";

const logger: Logger = LogFactory.create("TagSlice");

const getNextRequestTime = () => moment().add(2, "minutes");

type TagInfoState = "initial" | "loading" | "failed" | "ready";

type TagInfoRequest = { state: TagInfoState; tag: string };

interface TagState {
	tags: BooruTag[];
	categories: BooruTagCategory[];
	tagFrequencies: {
		images: { [tag: string]: number };
		videos: { [tag: string]: number };
		vr: { [tag: string]: number };
		all: { [tag: string]: number };
	};
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
	post: BooruPost;
}

export const tagUpdateEdit = createAsyncThunk("tag/update_edit", async (req: TagUpdateEditRequest, thunkApi) => {
	const state: TagState = (thunkApi.getState() as any).tag;

	const realm = req.post.tags.indexOf("vr") != -1 ? "vr" : req.post.mimeType.startsWith("image") ? "image" : "video";

	if (moment().isAfter(state.nextTagRequest)) {
		thunkApi.dispatch(tagList(null));
		return { prevTags: [], newTags: [], realm };
	}

	return {
		prevTags: req.prevTags,
		newTags: req.newTags,
		realm
	};
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
	tagFrequencies: { images: {}, videos: {}, vr: {}, all: {} },
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
			state.tags = Object.keys(action.payload.tags.all)
				.map(k => new BooruTag(k, action.payload.tags.all[k]))
				.sort((a, b) => b.frequency - a.frequency);
			state.categories = action.payload.categories;
			state.tagFrequencies = action.payload.tags;
			state.nextTagRequest = getNextRequestTime();
		});
		builder.addCase(tagList.rejected, (state, action) => {});
		builder.addCase(tagUpdateEdit.fulfilled, (state, action) => {
			action.payload.prevTags.forEach(t => {
				if (action.payload.realm == "video") {
					state.tagFrequencies.videos[t]--;
				}
				if (action.payload.realm == "vr") {
					state.tagFrequencies.vr[t]--;
				}
				if (action.payload.realm == "image") {
					state.tagFrequencies.images[t]--;
				}
				state.tagFrequencies.all[t]--;
			});
			action.payload.newTags.forEach(t => {
				if (action.payload.realm == "video") {
					state.tagFrequencies.videos[t]++;
				}
				if (action.payload.realm == "vr") {
					state.tagFrequencies.vr[t]++;
				}
				if (action.payload.realm == "image") {
					state.tagFrequencies.images[t]++;
				}
				state.tagFrequencies.all[t]++;
			});
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

export const selectTagFrequencies = (state: RootState) => {
	const freq = state.tag.tagFrequencies;

	if (
		SearchFilterOptions.instance.showImages &&
		SearchFilterOptions.instance.showVideo &&
		SearchFilterOptions.instance.showVr
	) {
		return freq.all;
	}

	return Util.addObjects(
		SearchFilterOptions.instance.showImages ? state.tag.tagFrequencies.images : {},
		SearchFilterOptions.instance.showVideo ? state.tag.tagFrequencies.videos : {},
		SearchFilterOptions.instance.showVr ? state.tag.tagFrequencies.vr : {}
	);
};
