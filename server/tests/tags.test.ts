/** @format */
import { beforeEach, expect, it } from "@jest/globals";
import { describe } from "node:test";

import request from "./include/Request";
import { tagData, tagInfoData } from "./include/TestData";
import { loginAdminRequest } from "./users.test";

const tagListRequest = (tag: string | undefined = undefined) =>
	tag ? request.get("/api/tag/list/" + tag) : request.get("/api/tag/list");

const tagInfoRequest = (tag: string) => request.get("/api/tag/info/" + tag);
const tagInfoEditRequest = (accessToken: string, tag: string, description: string) =>
	request
		.post("/api/tag/info/" + tag + "/edit")
		.auth(accessToken, { type: "bearer" })
		.send({ description });

describe("/tag/list", () => {
	it("should return a 200 and a success", async () => {
		const response = await tagListRequest();

		expect(response.statusCode).toBe(200);
		expect(response.body.type).toBe("success");
		expect(response.body.message).toBeUndefined();
	});

	it("should return correct tag information", async () => {
		const response = await tagListRequest();
		expect(response.body.type).toBe("success");
		expect(response.body.result).toBeDefined();
		expect(response.body.result.tags).toBeTruthy();
		tagData.forEach(t => {
			expect(response.body.result.tags[t.tag]).toBe(t.count);
		});
	});

	it("should return correct category information", async () => {
		const response = await tagListRequest();
		expect(response.body.type).toBe("success");
		expect(response.body.result).toBeDefined();
		expect(response.body.result.categories).toHaveLength(1);
		expect(response.body.result.categories[0].category).toBe("a");
		expect(response.body.result.categories[0].display_singular).toBe("A");
		expect(response.body.result.categories[0].display_multiple).toBe("As");
	});
});
describe("/tag/list/:tag", () => {
	it("should return a 200 and a success", async () => {
		const response = await tagListRequest("a");
		expect(response.statusCode).toBe(200);
		expect(response.body.type).toBe("success");
		expect(response.body.message).toBeUndefined();
	});

	it("should return correct tag information", async () => {
		const response = await tagListRequest("a");
		expect(response.body.type).toBe("success");

		expect(response.body.result).toBeDefined();
		expect(response.body.result.tags).toBeTruthy();
		tagData.forEach(t => {
			if (t.tag.startsWith("a")) {
				expect(response.body.result.tags[t.tag]).toBe(t.count);
			}
		});
	});
});

describe("/tag/info/:tag", () => {
	it("should return a 200 and a success", async () => {
		const response = await tagInfoRequest("test1");

		expect(response.statusCode).toBe(200);
		expect(response.body.type).toBe("success");
		expect(response.body.message).toBeUndefined();
	});

	it("should return correct tag information", async () => {
		const response = await tagInfoRequest("test1");
		expect(response.body.type).toBe("success");

		expect(response.body.result).toBeDefined();
		expect(response.body.result.description).toBe(tagInfoData[0].description);
	});
});

describe("/tag/info/:tag/edit", () => {
	let accessToken: any;
	beforeEach(async () => {
		const response = await loginAdminRequest();
		expect(response.statusCode).toBe(200);
		expect(response.body.type).toBe("success");

		expect(response.body.result).toBeDefined();
		expect(response.body.result.access).toBeDefined();
		expect(response.body.result.access.token).toBeTruthy();
		accessToken = response.body.result.access.token;
	});

	it("should give a 401 and an error on a missing token", async () => {
		const response = await tagInfoEditRequest("", "test3", "hello world");
		expect(response.statusCode).toBe(401);
		expect(response.body.type).toBe("error");
		expect(response.body.message).toBeTruthy();
	});

	it("should give a 200 and a success on a successful edit", async () => {
		const response = await tagInfoEditRequest(accessToken, "test3", "hello world");
		expect(response.statusCode).toBe(200);
		expect(response.body.type).toBe("success");
	});

	it("should correctly update tag info on successful edit", async () => {
		const response = await tagInfoEditRequest(accessToken, "test3", "hello world!");
		expect(response.body.type).toBe("success");

		const infoResponse = await tagInfoRequest("test3");
		expect(infoResponse.body.type).toBe("success");
		expect(infoResponse.body.result).toBeDefined();
		expect(infoResponse.body.result.description).toBe("hello world!");
	});
});
