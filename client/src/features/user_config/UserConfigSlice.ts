/** @format */
import { createAsyncThunk, createSlice, Reducer } from "@reduxjs/toolkit";
import { notify } from "reapop";

import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import UserConfigService, { UserConfig } from "./UserConfigService";
import { AsyncValue, StoredAsyncValue } from "../AsyncValue";
import { StaticUIErrorFactory, UIErrorFactory } from "../../util/UIError";

const logger: Logger = LogFactory.create("UserConfigSlice");
const errorFactory: StaticUIErrorFactory = new StaticUIErrorFactory(
	"UserConfigSlice"
);

const configValue = new AsyncValue<UserConfig>("user_config", "config", {});

interface UserConfigState {
	config: StoredAsyncValue<UserConfig>;
}

export const userConfigGet = configValue.addAsyncAction(
	"user_config/get",
	(_: null) =>
		errorFactory.wrapErrorOnly(
			UserConfigService.get(),
			"modules.user_config.errors.get"
		)
);

export const userConfigSet = configValue.addAsyncAction(
	"user_config/set",
	(config: UserConfig) =>
		errorFactory.wrapErrorOnly(
			UserConfigService.set(config),
			"modules.user_config.errors.set"
		)
);

const initialState: UserConfigState = {
	config: configValue.storedValue
};

export const UserConfigSlice = createSlice({
	name: "user_config",
	initialState,
	reducers: {},
	extraReducers: builder => {
		configValue.setupReducers(builder);
	}
});

export default UserConfigSlice.reducer as Reducer<UserConfigState>;
export const selectUserConfigState = (state: RootState) => state.user_config;
