/** @format */

import { PrismaClient, User } from ".prisma/client";
import express, { NextFunction, Request, Response, Router } from "express";
import { injectable } from "tsyringe";
import { IRouter } from "../../IRouter";
import AsyncHandler from "express-async-handler";
import Util from "../../util/Util";
import bcrypt from "bcrypt";
import jwt, { verify } from "jsonwebtoken";
import moment from "moment";
import ApiAsyncHandler, { ApiResponse } from "../../util/ApiAsyncHandler";
import AuthUtil from "./AuthUtil";
import { AuthenticatedRequest, validateUserToken } from "./Middleware";
import readConfig, { Config } from "../../Config";
import usePrisma from "../../Prisma";

@injectable()
export class UserRouter implements IRouter {
	createRouter(): Router {
		const router = express.Router();

		router.use((req, res, next) => {
			res.type("application/json");
			next();
		});

		router.get("/info", validateUserToken(true), (req: AuthenticatedRequest, res) => {
			res.send(JSON.stringify({ user: req.user == undefined ? null : Util.exclude(req.user, ["pass"]) }));
		});

		router.get(
			"/nginx_callback",
			validateUserToken(false),
			AsyncHandler(async (req: AuthenticatedRequest, res) => {
				let user = req.user;

				// for now, support http basic auth in this endpoint
				const credentials = AuthUtil.decodeBasicHeader(req.headers.authorization ?? "");
				if (!user && credentials.username.length > 0 && credentials.password.length > 0) {
					const userResult = await this.getUserByNameAndPass(credentials.username, credentials.password);
					user = userResult.user;
				}

				res.status(user == null ? 401 : 200)
					.send(JSON.stringify({ result: user != null ? "success" : "needs_auth" }))
					.end();
			})
		);

		// POST /user/login with { username: string, password: string, rememberMe: boolean }
		router.post("/login", ApiAsyncHandler(this.handleLogin));

		// POST /user/refresh with { refreshToken: string }
		router.post("/refresh", ApiAsyncHandler(this.handleRefresh));

		router.post("/register", (req, res) => {});

		return router;
	}

	private async handleRefresh(req: Request, res: Response): Promise<ApiResponse> {
		const refreshToken: string = req.body.refreshToken || "";
		if (refreshToken.length == 0) {
			return { type: "error", message: "no refresh token" };
		}

		const config = readConfig();

		const decoded = AuthUtil.verifyAuthToken(config, refreshToken);
		if (decoded == null || decoded.id == null || decoded.name == null || decoded.type == null) {
			return { type: "error", message: "invalid token" };
		}

		if (decoded.type != "refresh") {
			return { type: "error", message: "not a refresh token" };
		}

		const prisma = usePrisma();

		const user = await prisma.user.findUnique({ where: { id: decoded.id } });
		if (user == null) {
			return { type: "error", message: "user not found" };
		}

		return {
			type: "success",
			result: {
				access: await AuthUtil.generateAuthToken(config, user, "access"),
				user: Util.exclude(user, ["pass"])
			}
		};
	}

	private async handleLogin(req: Request, res: Response): Promise<ApiResponse> {
		// try credentials from HTTP basic auth
		let credentials = AuthUtil.decodeBasicHeader(req.headers.authorization || "");
		// give preference to POST body
		credentials.username = req.body.username || credentials.username;
		credentials.password = req.body.password || credentials.password;

		const rememberMe = !!req.body.rememberMe || false;

		const userResult = await this.getUserByNameAndPass(credentials.username, credentials.password);
		if (!userResult.user) {
			return { type: "error", message: userResult.message ?? "unknown error" };
		}

		const { user } = userResult;

		const config = readConfig();

		let response = {
			access: await AuthUtil.generateAuthToken(config, user, "access"),
			refresh: rememberMe ? await AuthUtil.generateAuthToken(config, user, "refresh") : null,
			user: Util.exclude(user, ["pass"])
		};

		return { type: "success", result: response };
	}

	private async getUserByNameAndPass(name: string, pass: string): Promise<{ user?: User; message?: string }> {
		const prisma = usePrisma();

		// check DB
		const user = await prisma.user.findUnique({ where: { name: name } });
		if (user == null) {
			return { message: "user not found" };
		}

		// check if valid password
		const result = await new Promise((resolve, reject) => {
			bcrypt.compare(pass, Util.fixBcryptHash(user.pass || ""), (err, result) => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});

		return result ? { user } : { user, message: "incorrect password" };
	}
}
