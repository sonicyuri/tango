/** @format */
import { CaseReducer, createAsyncThunk, createSlice, PayloadAction, Reducer } from "@reduxjs/toolkit";
import moment from "moment";
import { notify } from "reapop";

import { BooruTag, BooruTagCategory } from "../../models/BooruTag";
import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import TagAliasService from "./TagAliasService";

const logger: Logger = LogFactory.create("TagAliasSlice");

type TagAliasLoadingState = "initial" | "loading" | "ready";

interface TagAliasState {
	tagAliases: { [oldTag: string]: string };
	loadingState: TagAliasLoadingState;
}

const setAliasStateReducer: CaseReducer<TagAliasState, PayloadAction<TagAliasLoadingState>> = (state, action) => {
	state.loadingState = action.payload;
};

const setAliasState = (newState: TagAliasLoadingState): PayloadAction<TagAliasLoadingState> => ({
	type: "tag_alias/setAliasState",
	payload: newState
});

export const tagAliasList = createAsyncThunk("tag_alias/list", async (_: null, thunkApi) => {
	try {
		thunkApi.dispatch(setAliasState("loading"));

		const result = await TagAliasService.getTagAliases();

		if (result.type == "error") {
			logger.error("error listing tag aliases", result.message);
			thunkApi.dispatch(notify("failed to obtain tag aliases", "error"));
			return thunkApi.rejectWithValue({});
		}

		return result.result;
	} catch (error: any) {
		logger.error("error listing tag aliases", error);
		thunkApi.dispatch(notify("failed to obtain tag aliases", "error"));
		return thunkApi.rejectWithValue({});
	}
});

const initialState: TagAliasState = {
	tagAliases: {},
	loadingState: "initial"
};

export const TagAliasSlice = createSlice({
	name: "tag_alias",
	initialState,
	reducers: {
		setAliasState: setAliasStateReducer
	},
	extraReducers: builder => {
		builder.addCase(tagAliasList.fulfilled, (state, action) => {
			state.tagAliases = action.payload;
			state.loadingState = "ready";
		});
		builder.addCase(tagAliasList.rejected, (state, action) => {});
	}
});

export default TagAliasSlice.reducer as Reducer<TagAliasState>;
export const selectTagAliasState = (state: RootState) => state.tag_alias;
