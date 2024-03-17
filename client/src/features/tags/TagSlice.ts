/** @format */
import {
	CaseReducer,
	createAsyncThunk,
	createSlice,
	PayloadAction,
	Reducer
} from "@reduxjs/toolkit";
import moment from "moment";
import { notify } from "reapop";
import { BooruPost } from "../../models/BooruPost";
import { createSelector } from "reselect";

import { BooruTag, BooruTagCategory } from "../../models/BooruTag";
import { LogFactory, Logger } from "../../util/Logger";
import { Util } from "../../util/Util";
import { SearchFilterOptions } from "../SearchFilterOptions";
import { RootState } from "../Store";
import TagService, { TagInfoResponse, TagListResponse } from "./TagService";
import { StaticUIErrorFactory } from "../../util/UIError";
import { AsyncValue, StoredAsyncValue } from "../AsyncValue";
import { Result } from "../../util/Result";
import { AsyncMapValue, StoredAsyncMapValue } from "../AsyncMapValue";

const logger: Logger = LogFactory.create("TagSlice");
const errorFactory: StaticUIErrorFactory = new StaticUIErrorFactory("TagSlice");

const getNextRequestTime = () => moment().add(2, "minutes");

export type TagsListData = TagListResponse;

const tagsListValue = new AsyncValue<TagsListData>("tag", "tagsData", {
	tags: [],
	categories: [],
	tagFrequencies: {}
});

const tagInfosValue = new AsyncMapValue<TagInfoResponse>("tag", "tagInfos");

interface TagState {
	tagsData: StoredAsyncValue<TagsListData>;
	nextTagRequest: moment.Moment;
	tagInfos: StoredAsyncMapValue<TagInfoResponse>;
}

export const tagList = tagsListValue.addAsyncAction("tag/list", (_: null) =>
	errorFactory.wrapErrorOnly(TagService.getTags(), "modules.tags.errors.list")
);

interface TagUpdateEditRequest {
	prevTags: string[];
	newTags: string[];
	post: BooruPost;
}

export const tagUpdateEdit = tagsListValue.addAction(
	"tag/update_edit",
	(state: TagsListData, payload: TagUpdateEditRequest) => {
		payload.prevTags.forEach(t => {
			state.tagFrequencies[t] = (state.tagFrequencies[t] || 1) - 1;
		});
		payload.newTags.forEach(t => {
			state.tagFrequencies[t] = (state.tagFrequencies[t] || 0) + 1;
		});

		return Result.success(state);
	}
);

export const tagInfoGet = tagInfosValue.addAsyncAction(
	"tag/get_info",
	(tag: string) => tag,
	(tag: string) =>
		errorFactory.wrapErrorOnly(
			TagService.getTagInfo(tag),
			"modules.tags.errors.info"
		)
);

const initialState: TagState = {
	tagsData: tagsListValue.storedValue,
	nextTagRequest: getNextRequestTime(),
	tagInfos: tagInfosValue.storedValue
};

export const TagSlice = createSlice({
	name: "tag",
	initialState,
	reducers: {},
	extraReducers: builder => {
		tagsListValue.setupReducers(builder);
		tagInfosValue.setupReducers(builder);
	}
});

export default TagSlice.reducer as Reducer<TagState>;

export const selectTagState = createSelector(
	[(state: RootState) => state.tag],
	tag => tagsListValue.decomposeProperties<TagListResponse, TagState>(tag)
);
