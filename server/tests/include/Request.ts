/** @format */

import request from "supertest";

const BaseUrl = "http://localhost:3033";

const newRequest: request.SuperTest<request.Test> = request(BaseUrl);
export type Response = request.Response;
export default newRequest;
