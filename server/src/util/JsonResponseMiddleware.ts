/** @format */

import { NextFunction, Request, Response } from "express";

export default function jsonResponse(req: Request, res: Response, next: NextFunction): void {
	res.type("application/json");
	next();
}
