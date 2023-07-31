/** @format */

import { createSlice, createAsyncThunk, CaseReducer, PayloadAction } from "@reduxjs/toolkit";
import { notify } from "reapop";
import { CredentialsInvalidError } from "../BooruRequest";
import { User } from "../../models/BooruUser";
import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";

import AuthService, { Credentials } from "./AuthService";
import { tagList } from "../tags/TagSlice";

const logger: Logger = LogFactory.create("AuthSlice");

interface AuthState {
	isLoggedIn: boolean;
	user: User | null;
}

export const login = createAsyncThunk("auth/login", async (credentials: Credentials, thunkApi) => {
	try 
	{
		const user = await AuthService.login(credentials);
		thunkApi.dispatch(notify("Login successful!", "success"));
		thunkApi.dispatch(tagList(null));
		return user;
	} 
	catch (error: any) 
	{
		logger.error("error logging in", error);
		if (error instanceof CredentialsInvalidError) 
		{
			thunkApi.dispatch(notify("Login failed - invalid credentials", "error"));
		} 
		else 
		{
			thunkApi.dispatch(notify("Login failed - unknown error", "error"));
		}

		return thunkApi.rejectWithValue({});
	}
});

const logoutReducer: CaseReducer<AuthState, PayloadAction<void>> = (state, action) => {
	AuthService.logout();
	state.isLoggedIn = false;
};

export const logout = (): PayloadAction<void> => ({
	type: "auth/logout",
	payload: undefined
});

const initialState: AuthState = {
	isLoggedIn: false,
	user: null
};

export const AuthSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		logout: logoutReducer
	},
	extraReducers: builder => {
		builder.addCase(login.fulfilled, (state, action) => {
			state.isLoggedIn = true;
			state.user = action.payload;
		});
		builder.addCase(login.rejected, (state, action) => {
			state.isLoggedIn = false;
			state.user = null;
		});
	}
});

export default AuthSlice.reducer;
export const selectAuthState = (state: RootState) => state.auth;
