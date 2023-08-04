/** @format */
import { createAsyncThunk, createSlice, Reducer } from '@reduxjs/toolkit';

import { BooruTag, BooruTagCategory } from '../../models/BooruTag';
import { LogFactory, Logger } from '../../util/Logger';
import { RootState } from '../Store';
import TagService from './TagService';


const logger: Logger = LogFactory.create("TagSlice");

interface TagState {
	tags: BooruTag[];
	categories: BooruTagCategory[],
	tagFrequencies: { [tag: string]: number };
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
	tags: [],
	tagFrequencies: {},
	categories: []
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
			state.tags.forEach(t => state.tagFrequencies[t.tag] = t.frequency);
		});
		builder.addCase(tagList.rejected, (state, action) => {
		});
	}
});

export default TagSlice.reducer as Reducer<TagState>;
export const selectTagState = (state: RootState) => state.tag;
