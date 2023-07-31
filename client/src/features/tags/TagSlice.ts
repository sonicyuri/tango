/** @format */

import { createSlice, createAsyncThunk, CaseReducer, PayloadAction } from "@reduxjs/toolkit";
import { notify } from "reapop";
import { CredentialsInvalidError } from "../BooruRequest";
import { User } from "../../models/BooruUser";
import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import TagService from "./TagService";

const logger: Logger = LogFactory.create("TagSlice");

interface TagState {
	tags: string[];
}

export const tagList = createAsyncThunk("tag/list", async (_: null, thunkApi) => {
	try 
	{
		return await TagService.getTags();
	} 
	catch (error: any) 
	{
		logger.error("error listing tags", error);
		return thunkApi.rejectWithValue({});
	}
});

const initialState: TagState = {
	tags: []
};

export const TagSlice = createSlice({
	name: "tag",
	initialState,
	reducers: {},
	extraReducers: builder => {
		builder.addCase(tagList.fulfilled, (state, action) => {
			state.tags = action.payload;
		});
		builder.addCase(tagList.rejected, (state, action) => {
			state.tags = [];
		});
	}
});

export default TagSlice.reducer;
export const selectTagState = (state: RootState) => state.tag;
