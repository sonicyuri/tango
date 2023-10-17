/** @format */
import { createAsyncThunk, createSlice, Reducer } from "@reduxjs/toolkit";
import { notify } from "reapop";

import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import UserConfigService, { UserConfig } from "./UserConfigService";

const logger: Logger = LogFactory.create("UserConfigSlice");

interface UserConfigState {
	config: UserConfig;
}

export const userConfigGet = createAsyncThunk("user_config/get", async (_: null, thunkApi) => {
	try {
		let result = await UserConfigService.get();
		if (result.type == "error") {
			logger.error("error fetching config", result.message);
			thunkApi.dispatch(notify("Error fetching user config: " + result.message, "error"));
			return thunkApi.rejectWithValue({});
		}

		return result.result;
	} catch (error: any) {
		logger.error("error fetching config", error);
		thunkApi.dispatch(notify("Error fetching user config", "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const userConfigSet = createAsyncThunk("user_config/set", async (config: UserConfig, thunkApi) => {
	try {
		let result = await UserConfigService.set(config);
		if (result.type == "error") {
			logger.error("error setting config", result.message);
			thunkApi.dispatch(notify("Error setting user config: " + result.message, "error"));
			return thunkApi.rejectWithValue({});
		}

		return result.result;
	} catch (error: any) {
		logger.error("error setting config", error);
		thunkApi.dispatch(notify("Error setting user config", "error"));
		return thunkApi.rejectWithValue({});
	}
});

const initialState: UserConfigState = {
	config: {}
};

export const UserConfigSlice = createSlice({
	name: "user_config",
	initialState,
	reducers: {},
	extraReducers: builder => {
		builder.addCase(userConfigGet.fulfilled, (state, action) => {
			state.config = action.payload;
		});
		builder.addCase(userConfigGet.rejected, (state, action) => {});

		builder.addCase(userConfigSet.fulfilled, (state, action) => {
			state.config = action.payload;
		});

		builder.addCase(userConfigSet.rejected, (state, action) => {});
	}
});

export default UserConfigSlice.reducer as Reducer<UserConfigState>;
export const selectUserConfigState = (state: RootState) => state.user_config;
