/** @format */

import { describe } from "node:test";
import { beforeAll, beforeEach, it, expect } from "@jest/globals";
import request, { Response } from "./include/Request";
import { AdminPassword, AdminUsername, UserPassword, UserUsername } from "./include/TestData";
import AuthUtil from "../src/modules/users/AuthUtil";
import readConfig from "../src/Config";

export const loginRequest = (username: string, password: string, rememberMe: boolean = false) =>
	request.post("/api/user/login").send({ username, password, rememberMe });

export const loginUserRequest = (rememberMe: boolean = false) => loginRequest(UserUsername, UserPassword, rememberMe);
export const loginAdminRequest = (rememberMe: boolean = false) =>
	loginRequest(AdminUsername, AdminPassword, rememberMe);

const refreshRequest = (refreshToken: string) => request.post("/api/user/refresh").send({ refreshToken });
const infoRequest = (accessToken: string) => request.get("/api/user/info").auth(accessToken, { type: "bearer" });
const nginxCallbackRequest = (accessToken: string) =>
	request.get("/api/user/nginx_callback").auth(accessToken, { type: "bearer" });

describe("/user/login", () => {
	const config = readConfig();

	it("should return 200 and a success", async () => {
		const response = await loginUserRequest();
		expect(response.statusCode).toBe(200);
		expect(response.body.type).toBe("success");
		expect(response.body.message).toBeUndefined();
	});

	it("should return an error with invalid credentials", async () => {
		const response = await loginRequest("a", "b", true);
		expect(response.body.type).toBe("error");
		expect(response.body.message).toBeDefined();
	});

	it("should return valid tokens", async () => {
		const response = await loginUserRequest();
		expect(response.body.type).toBe("success");

		expect(response.body.result.access).toBeDefined();
		expect(response.body.result.refresh).toBeDefined();

		const accessToken = response.body.result.access.token;
		expect(accessToken).toBeTruthy();

		const accessPayload = AuthUtil.verifyAuthToken(config, accessToken);
		expect(accessPayload.id).toBeDefined();
		expect(accessPayload.name).toBe(UserUsername);
		expect(accessPayload.type).toBe("access");
	});

	it("should return a valid refresh token", async () => {
		const response = await loginUserRequest(true);
		expect(response.body.type).toBe("success");

		expect(response.body.result.access).toBeDefined();

		const refreshToken = response.body.result.refresh.token;
		expect(refreshToken).toBeTruthy();

		const refreshPayload = AuthUtil.verifyAuthToken(config, refreshToken);
		expect(refreshPayload.id).toBeDefined();
		expect(refreshPayload.name).toBe(UserUsername);
		expect(refreshPayload.type).toBe("refresh");
	});

	it("should return the correct user", async () => {
		const response = await loginUserRequest();
		expect(response.body.result.user).toBeDefined();
		expect(response.body.result.user.name).toBe(UserUsername);
	});
});

describe("/user/refresh", () => {
	const config = readConfig();
	let refreshToken: any;

	beforeEach(async () => {
		const loginResponse = await loginUserRequest(true);
		refreshToken = loginResponse.body.result?.refresh?.token;
	});

	it("should return a 200 and a success", async () => {
		expect(refreshToken).toBeTruthy();
		const response = await refreshRequest(refreshToken);
		expect(response.statusCode).toBe(200);
		expect(response.body.type).toBe("success");
		expect(response.body.message).toBeUndefined();
	});

	it("should return a valid new access token", async () => {
		expect(refreshToken).toBeTruthy();

		const response = await refreshRequest(refreshToken);
		expect(response.body.type).toBe("success");

		expect(response.body.result).toBeDefined();
		expect(response.body.result.access).toBeDefined();
		expect(response.body.result.access.token).toBeDefined();

		const accessToken = response.body.result.access.token;
		const accessPayload = AuthUtil.verifyAuthToken(config, accessToken);
		expect(accessPayload.type).toBe("access");
		expect(accessPayload.id).toBeDefined();
		expect(accessPayload.name).toBe(UserUsername);
	});

	it("should return a valid user", async () => {
		expect(refreshToken).toBeTruthy();

		const response = await refreshRequest(refreshToken);
		expect(response.body.type).toBe("success");

		expect(response.body.result).toBeDefined();
		expect(response.body.result.user).toBeDefined();
		expect(response.body.result.user.name).toBe(UserUsername);
	});
});

describe("/user/info", async () => {
	let accessToken: any;

	beforeEach(async () => {
		const loginResponse = await loginUserRequest(true);
		accessToken = loginResponse.body.result?.access?.token;
	});

	it("should return a 200 and a success", async () => {
		expect(accessToken).toBeTruthy();
		const response = await infoRequest(accessToken);

		expect(response.statusCode).toBe(200);
		expect(response.body.type).toBe("success");
		expect(response.body.message).toBeUndefined();
	});

	it("should return a valid user", async () => {
		expect(accessToken).toBeTruthy();
		const response = await infoRequest(accessToken);
		expect(response.body.type).toBe("success");

		expect(response.body.result).toBeDefined();
		expect(response.body.result.name).toBe(UserUsername);
	});
});

describe("/user/nginx_callback", async () => {
	it("should return a 200 and a success", async () => {
		const loginResponse = await loginUserRequest(true);
		expect(loginResponse.statusCode).toBe(200);

		const accessToken = loginResponse.body.result?.access?.token;
		expect(accessToken).toBeTruthy();

		const response = await nginxCallbackRequest(accessToken);
		expect(response.statusCode).toBe(200);
		expect(response.body.type).toBe("success");
	});
});
