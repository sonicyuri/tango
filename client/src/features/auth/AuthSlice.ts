/** @format */
import { CaseReducer, createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { notify } from "reapop";

import { User } from "../../models/BooruUser";
import { LogFactory, Logger } from "../../util/Logger";
import { CredentialsInvalidError } from "../BooruRequest";
import { favoriteList } from "../favorites/FavoriteSlice";
import { RootState } from "../Store";
import { tagList } from "../tags/TagSlice";
import AuthService, { Credentials } from "./AuthService";

const logger: Logger = LogFactory.create("AuthSlice");

type LoginState = "initial" | "loading" | "failed" | "success";

interface AuthState {
	isLoggedIn: boolean;
	user: User | null;
	loginState: LoginState;
}

const setLoginState: CaseReducer<AuthState, PayloadAction<LoginState>> = (state, action) => {
	state.loginState = action.payload;
};

const setLoginStateAction = (newState: LoginState): PayloadAction<LoginState> => ({
	type: "auth/setLoginState",
	payload: newState
});

export const login = createAsyncThunk("auth/login", async (credentials: Credentials, thunkApi) => {
	try {
		thunkApi.dispatch(setLoginStateAction("loading"));

		const user = await AuthService.login(credentials);
		thunkApi.dispatch(notify("Login successful!", "success"));

		thunkApi.dispatch(tagList(null));
		thunkApi.dispatch(favoriteList(null));

		return user;
	} catch (error: any) {
		logger.error("error logging in", error);
		if (error instanceof CredentialsInvalidError) {
			thunkApi.dispatch(notify("Login failed - invalid credentials", "error"));
		} else {
			thunkApi.dispatch(notify("Login failed - unknown error", "error"));
		}

		return thunkApi.rejectWithValue({});
	}
});

const logoutReducer: CaseReducer<AuthState, PayloadAction<void>> = (state, action) => {
	AuthService.logout();
	state.isLoggedIn = false;
	state.loginState = "initial";
};

export const logout = (): PayloadAction<void> => ({
	type: "auth/logout",
	payload: undefined
});

const initialState: AuthState = {
	isLoggedIn: false,
	user: null,
	loginState: "initial"
};

export const AuthSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		logout: logoutReducer,
		setLoginState
	},
	extraReducers: builder => {
		builder.addCase(login.fulfilled, (state, action) => {
			state.isLoggedIn = true;
			state.user = action.payload;
			state.loginState = "success";
		});
		builder.addCase(login.rejected, (state, action) => {
			state.isLoggedIn = false;
			state.user = null;
			state.loginState = "failed";
		});
	}
});

export default AuthSlice.reducer;
export const selectAuthState = (state: RootState) => state.auth;
