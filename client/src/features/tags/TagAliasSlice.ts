/** @format */
import { createSlice, Reducer } from "@reduxjs/toolkit";

import { LogFactory, Logger } from "../../util/Logger";
import { StaticUIErrorFactory } from "../../util/UIError";
import { AsyncValue, StoredAsyncValue } from "../AsyncValue";
import { RootState } from "../Store";
import TagAliasService, { TagAliasListResponse } from "./TagAliasService";

const logger: Logger = LogFactory.create("TagAliasSlice");
const errorFactory: StaticUIErrorFactory = new StaticUIErrorFactory(
	"TagAliasSlice"
);

const tagAliasesValue = new AsyncValue<TagAliasListResponse>(
	"tag_alias",
	"aliases",
	{}
);

interface TagAliasState {
	aliases: StoredAsyncValue<TagAliasListResponse>;
}

export const tagAliasList = tagAliasesValue.addAsyncAction(
	"tag_alias/list",
	(_: null) =>
		errorFactory.wrapErrorOnly(
			TagAliasService.getTagAliases(),
			"modules.tags.errors.listAliases"
		)
);

const initialState: TagAliasState = {
	aliases: tagAliasesValue.storedValue
};

export const TagAliasSlice = createSlice({
	name: "tag_alias",
	initialState,
	reducers: {},
	extraReducers: builder => {
		tagAliasesValue.setupReducers(builder);
	}
});

export default TagAliasSlice.reducer as Reducer<TagAliasState>;
export const selectTagAliasState = (state: RootState) => state.tag_alias;
