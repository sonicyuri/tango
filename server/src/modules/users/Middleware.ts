/** @format */

import { PrismaClient, User } from ".prisma/client";
import { NextFunction, Request, Response } from "express";
import Util from "../../util/Util";
import AuthUtil from "./AuthUtil";
import { container } from "tsyringe";
import readConfig, { Config } from "../../Config";
import { prisma } from "../../Prisma";
import { Permissions, UserClass } from "../../../../shared/src";

const logger = Util.getLogger("modules/users/Middleware");

export interface AuthenticatedRequest extends Request {
	user?: User;
}

export function getUserFromToken(
	shouldFailIfNotAuthed: boolean = true
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
	const config = readConfig();

	return (req, res, next) => {
		req.user = undefined;

		const authHeader = req.headers.authorization;
		if (authHeader == null || authHeader.length == 0) {
			if (shouldFailIfNotAuthed) {
				res.status(401)
					.send(Util.formatApiResponse({ type: "error", message: "needs authentication token" }))
					.end();
			} else {
				next();
			}

			return;
		}

		const parts = authHeader.split(" ");
		if (parts.length < 2 || parts[0] != "Bearer") {
			if (shouldFailIfNotAuthed) {
				res.status(401)
					.send(Util.formatApiResponse({ type: "error", message: "invalid auth token" }))
					.end();
			} else {
				next();
			}

			return;
		}

		const decoded = AuthUtil.verifyAuthToken(config, parts[1]);
		if (decoded == null || decoded.type != "access" || decoded.id == null || decoded.name == null) {
			if (shouldFailIfNotAuthed) {
				res.status(401)
					.send(Util.formatApiResponse({ type: "needs_auth" }))
					.end();
			} else {
				next();
			}
			return;
		}

		prisma.user
			.findUnique({ where: { id: decoded.id } })
			.then(user => {
				if (user == null && shouldFailIfNotAuthed) {
					res.status(401)
						.send(Util.formatApiResponse({ type: "error", message: "user not found" }))
						.end();
				} else {
					req.user = user || AuthUtil.createAnonymousUser();
					next();
				}
			})
			.catch(error => {
				logger.error(error);
				res.status(500)
					.send(Util.formatApiResponse({ type: "error", message: "unknown database error" }))
					.end();
			});
	};
}

export function requirePermissions(
	...abilities: (keyof Permissions)[]
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
	return (req, res, next) => {
		if (
			req.user == null ||
			abilities.filter(a => UserClass.canClass(req.user?.class ?? "anonymous", a)).length != abilities.length
		) {
			logger.warn(
				`user ${req.user?.name ?? "anonymous"} tried to access ${
					req.url
				} but can't satisfy permissions [${abilities.join(", ")}]`
			);
			res.status(403)
				.send(Util.formatApiResponse({ type: "error", message: "missing permissions" }))
				.end();
			return;
		}

		next();
	};
}
