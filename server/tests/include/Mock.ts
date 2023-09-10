/** @format */
import "reflect-metadata";

import { afterAll, beforeAll, beforeEach } from "@jest/globals";

import { Server } from "../../src/Server";
import { clearTestData, createTestData } from "./TestData";

const server = new Server();

beforeAll(async () => {
	await server.run();
});

beforeEach(async () => {
	await clearTestData();
	await createTestData();
});

afterAll(async () => {
	await server.destroy();
});
