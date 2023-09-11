/** @format */
import { beforeEach, expect, it } from "@jest/globals";
import { describe } from "node:test";

import request from "./include/Request";
import { tagAliasData, tagData, tagInfoData } from "./include/TestData";
import { loginAdminRequest } from "./users.test";

const tagAliasListRequest = (accessToken: string) =>
	request.get("/api/tag/alias/list").auth(accessToken, { type: "bearer" });

const tagAliasEditRequest = (accessToken: string, add: { [oldtag: string]: string }, remove: string[]) =>
	request.post("/api/tag/alias/edit").auth(accessToken, { type: "bearer" }).send({ add, remove });

describe("/tag/alias/list", () => {
	let accessToken: any;

	beforeEach(async () => {
		const response = await loginAdminRequest();
		expect(response.statusCode).toBe(200);
		expect(response.body.type).toBe("success");
		accessToken = response.body.result?.access?.token;
	});

	it("should return a 200 and a success", async () => {
		expect(accessToken).toBeTruthy();
		const response = await tagAliasListRequest(accessToken);
		expect(response.statusCode).toBe(200);
		expect(response.body.message).toBeUndefined();
		expect(response.body.type).toBe("success");
	});

	it("should return a 401 and error on missing token", async () => {
		const response = await tagAliasListRequest("");
		expect(response.statusCode).toBe(401);
		expect(response.body.type).toBe("error");
	});

	it("should return correct tag alias information", async () => {
		expect(accessToken).toBeTruthy();
		const response = await tagAliasListRequest(accessToken);
		expect(response.body.type).toBe("success");
		expect(response.body.result).toBeTruthy();
		tagAliasData.forEach(t => {
			expect(response.body.result[t.oldtag]).toBe(t.newtag);
		});
	});
});

describe("/tag/alias/edit", () => {
	let accessToken: any;

	beforeEach(async () => {
		const response = await loginAdminRequest();
		expect(response.statusCode).toBe(200);
		expect(response.body.type).toBe("success");
		accessToken = response.body.result?.access?.token;
	});

	it("should return a 200 and a success", async () => {
		expect(accessToken).toBeTruthy();
		const response = await tagAliasEditRequest(accessToken, {}, []);
		expect(response.statusCode).toBe(200);
		expect(response.body.message).toBeUndefined();
		expect(response.body.type).toBe("success");
	});

	it("should correctly update tag alias information", async () => {
		expect(accessToken).toBeTruthy();
		const response = await tagAliasEditRequest(accessToken, { "test3": "b2" }, ["test1"]);

		expect(response.body.type).toBe("success");
		expect(response.body.result).toBeTruthy();
		expect(response.body.result["test3"]).toBe("b2");
		expect(response.body.result["test1"]).toBeUndefined();

		const listResponse = await tagAliasListRequest(accessToken);
		expect(listResponse.body.type).toBe("success");
		expect(listResponse.body.result).toBeTruthy();
		expect(listResponse.body.result["test3"]).toBe("b2");
		expect(listResponse.body.result["test1"]).toBeUndefined();
	});
});
