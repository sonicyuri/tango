/** @format */
import { createSelector, createSlice } from "@reduxjs/toolkit";

import { User } from "../../models/BooruUser";
import { LogFactory, Logger } from "../../util/Logger";
import { Result } from "../../util/Result";
import { StaticUIErrorFactory } from "../../util/UIError";
import { AsyncValue, StoredAsyncValue } from "../AsyncValue";
import { RootState } from "../Store";
import { Credentials, SignupRequest } from "./AuthSchema";
import AuthService from "./AuthService";

const logger: Logger = LogFactory.create("AuthSlice");
const errorFactory: StaticUIErrorFactory = new StaticUIErrorFactory(
	"AuthSlice"
);

const userValue = new AsyncValue<User | null>("auth", "user", null);

interface AuthState {
	user: StoredAsyncValue<User | null>;
}

export const login = userValue.addAsyncAction(
	"auth/login",
	(request: Credentials) =>
		errorFactory.wrapErrorOnly(
			AuthService.login(request),
			"modules.auth.errors.login_failed"
		)
);

export const loginToken = userValue.addAsyncAction(
	"auth/loginToken",
	(request: { accessToken: string }) =>
		errorFactory.wrapErrorOnly(
			AuthService.loginToken(request.accessToken),
			"modules.auth.errors.token_login_failed"
		)
);

export const signup = userValue.addAsyncAction(
	"auth/signup",
	(request: SignupRequest) =>
		errorFactory.wrapErrorOnly(
			AuthService.signup(request).then(u => u.map(u => null)),
			"modules.auth.errors.signup_failed"
		)
);

export const logout = userValue.addAction("auth/logout", (state, _: null) => {
	AuthService.logout();
	return Result.success(null);
});

const initialState: AuthState = {
	user: userValue.storedValue
};

export const AuthSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {},
	extraReducers: builder => {
		userValue.setupReducers(builder);
	}
});

export default AuthSlice.reducer;
export const selectAuthState = createSelector(
	[(state: RootState) => state.auth],
	state => ({
		user: state.user,
		isLoggedIn: state.user.ready() && state.user.value != null
	})
);
