/** @format */

import { NextFunction, Request, Response } from "express";

export function notFound(req: Request, res: Response, next: NextFunction) {
	res.type("json")
		.status(404)
		.json({ type: "error", message: "can't find route " + req.url })
		.end();
}
