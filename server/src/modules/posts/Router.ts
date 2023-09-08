/** @format */

import { Post, PostTag, PrismaClient, User } from ".prisma/client";
import express, { NextFunction, Request, Response, Router } from "express";
import { injectable } from "tsyringe";
import { IRouter } from "../../IRouter";
import AsyncHandler from "express-async-handler";
import Util from "../../util/Util";
import bcrypt from "bcrypt";
import jwt, { verify } from "jsonwebtoken";
import moment from "moment";
import ApiAsyncHandler, { ApiResponse } from "../../util/ApiAsyncHandler";
import readConfig, { Config } from "../../Config";
import usePrisma from "../../Prisma";
import { getUserFromToken, requirePermissions } from "../users/Middleware";

@injectable()
export class PostRouter implements IRouter {
	createRouter(): Router {
		const router = express.Router();

		router.use(getUserFromToken(false));

		router.get("/list/:query", ApiAsyncHandler(this.handleList));
		router.get("/list", ApiAsyncHandler(this.handleList));

		router.post("/edit", requirePermissions("edit_image_tag"), ApiAsyncHandler(this.handleEdit));

		router.get("/:postId", ApiAsyncHandler(this.handleFind));

		return router;
	}

	private async handleList(req: Request, res: Response): Promise<ApiResponse> {
		return { type: "error", message: "not implemented" };
	}

	private async handleFind(req: Request, res: Response): Promise<ApiResponse> {
		const prisma = new PrismaClient();

		/*const id = req.params.postId || req.query.postId || req.body.postId;

		if (!id) {
			return { type: "error", message: "missing post ID" };
		}

		const post: (Post & { post_tags?: PostTag[] }) | null = await prisma.post.findUnique({
			where: { id },
			include: { post_tags: true }
		});

		if (!post) {
			return { type: "error", message: "can't find post" };
		}

		const p = post.post_tags;
		const postResult: { [k: string]: any } = {};
		Object.assign(postResult, Util.exclude(post, ["owner_ip", "post_tags"]));

		const tags: string[];
		p?.forEach(tag => {});*/

		//return { type: "success", result: post };
		return { type: "error", message: "not implemented" };
	}

	private async handleEdit(req: Request, res: Response): Promise<ApiResponse> {
		return { type: "error", message: "not implemented" };
	}
}
