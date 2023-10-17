/** @format */
import { CaseReducer, createAsyncThunk, createSlice, PayloadAction, Reducer } from "@reduxjs/toolkit";
import { notify } from "reapop";

import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import ImportService, { ImportPrepareResponse, ImportPrepareResult } from "./ImportService";

const logger: Logger = LogFactory.create("ImportSlice");

type ImportLoadingState = "initial" | "loading" | "ready" | "failed";

interface ImportState {
	prepareResponse: ImportPrepareResult | null;
	lastImportedUrl: string;
	loadingState: ImportLoadingState;
}

const setLoadingState: CaseReducer<ImportState, PayloadAction<ImportLoadingState>> = (state, action) => {
	state.loadingState = action.payload;
};

const setLoadingStateAction = (newState: ImportLoadingState): PayloadAction<ImportLoadingState> => ({
	type: "import/setLoadingState",
	payload: newState
});

export const importPrepare = createAsyncThunk("import/prepare", async (url: string, thunkApi) => {
	try {
		thunkApi.dispatch(setLoadingStateAction("loading"));

		const res = await ImportService.prepare(url);
		if (res.type == "error") {
			logger.error("error preparing import", res.message);
			thunkApi.dispatch(notify("Import error: " + res.message, "error"));
			return thunkApi.rejectWithValue({});
		}

		return { result: res.result, url };
	} catch (error: any) {
		logger.error("error preparing import", error);
		return thunkApi.rejectWithValue({});
	}
});

const initialState: ImportState = {
	prepareResponse: null,
	lastImportedUrl: "",
	loadingState: "initial"
};

export const ImportSlice = createSlice({
	name: "import",
	initialState,
	reducers: {
		setLoadingState
	},
	extraReducers: builder => {
		builder.addCase(importPrepare.fulfilled, (state, action) => {
			state.loadingState = "ready";
			let { result, url } = action.payload;
			state.prepareResponse = result;
			state.lastImportedUrl = url;
		});

		builder.addCase(importPrepare.rejected, (state, action) => {
			state.loadingState = "failed";
			state.prepareResponse = null;
		});
	}
});

export default ImportSlice.reducer as Reducer<ImportState>;
export const selectImportState = (state: RootState) => state.import;
