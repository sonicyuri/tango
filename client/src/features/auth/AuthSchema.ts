/** @format */

import { ShimmieUser, User } from "../../models/BooruUser";

export type LoginApiResponse =
	| { type: "success"; result: LoginApiResult }
	| { type: "error"; message: string };
export interface LoginApiResult {
	access: JwtToken;
	refresh: JwtToken | null;
	user: ShimmieUser;
}
export interface JwtToken {
	token: string;
	expires: string;
}
export interface RefreshApiResult {
	access: JwtToken;
	user: ShimmieUser;
}
export type RefreshApiResponse =
	| { type: "success"; result: RefreshApiResult }
	| { type: "error"; message: string };
export type InfoApiResponse =
	| { type: "success"; result: ShimmieUser }
	| { type: "error"; message: string }
	| { type: "needs_auth" };
export interface Credentials {
	username: string;
	password: string;
	remember_me: boolean;
}
export interface SignupRequest {
	username: string;
	password: string;
	email: string | null;
	invite_code: string | null;
}
export type SignupResponse =
	| { type: "success"; result: User }
	| { type: "error"; message: string };
export type AuthResponse =
	| { type: "success"; result: User }
	| { type: "error"; message: string }
	| { type: "reset" };
