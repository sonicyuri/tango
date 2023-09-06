/** @format */

import core from "express-serve-static-core";
import express from "express";
import expressAsyncHandler from "express-async-handler";

export type ApiResponse =
	| { type: "success"; result: any }
	| { type: "error"; message: string }
	| { type: "needs_auth" };

export default function ApiAsyncHandler<P = core.ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = core.Query>(
	handler: (...args: Parameters<express.RequestHandler<P, ResBody, ReqBody, ReqQuery>>) => Promise<ApiResponse>
): express.RequestHandler<P, ResBody, ReqBody, ReqQuery> {
	return expressAsyncHandler(async (req, res, next) => {
		const result = await handler(req, res, next);

		res.status(result.type == "success" ? 200 : 400)
			.send(JSON.stringify(result) as any)
			.end();
	});
}
