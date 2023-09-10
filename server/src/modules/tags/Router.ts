/** @format */

import { Prisma, PrismaClient, User } from ".prisma/client";
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
import { prisma } from "../../Prisma";
import { getUserFromToken, requirePermissions } from "../users/Middleware";

@injectable()
export class TagRouter implements IRouter {
	createRouter(): Router {
		const router = express.Router();

		// GET { tag?: string } returns { tags: { [tag: string]: number }, categories: TagCategory[] }
		router.get("/list/:tag", ApiAsyncHandler(this.handleList));
		router.get("/list", ApiAsyncHandler(this.handleList));

		router.get("/info/:tag", ApiAsyncHandler(this.handleInfo));
		router.post(
			"/info/:tag/edit",
			getUserFromToken(true),
			requirePermissions("edit_tag_info"),
			ApiAsyncHandler(this.handleInfoSet)
		);

		return router;
	}

	private async handleList(req: Request, res: Response): Promise<ApiResponse> {
		const tag = req.params.tag || req.query.tag || null;

		const findManyParams = {
			include: {
				_count: { select: { post_tags: true } }
			}
		};

		if (tag != null) {
			Object.assign(findManyParams, { where: { tag: { startsWith: tag } } });
		}

		const tags = await prisma.tag.findMany(findManyParams);
		const tagCategories = await prisma.postTagCategory.findMany();

		const tagsMap: { [tag: string]: number } = {};

		tags.forEach(t => {
			if (t.count > 0) {
				tagsMap[t.tag] = t.count;
			}
		});

		return { type: "success", result: { tags: tagsMap, categories: tagCategories } };
	}

	private async handleInfo(req: Request, res: Response): Promise<ApiResponse> {
		const tag = req.params.tag || req.query.tag || req.body.tag;
		if (!tag) {
			return { type: "error", message: "no tag included" };
		}

		const tagObj = await prisma.tag.findFirst({ where: { tag } });

		if (tagObj == null) {
			return { type: "error", message: "tag not found" };
		}

		const infoObj = await prisma.tagInfo.findFirst({ where: { tag_id: tagObj.id } });
		return { type: "success", result: infoObj ? Util.exclude(infoObj, ["id", "tag_id"]) : { description: null } };
	}

	private async handleInfoSet(req: Request, res: Response): Promise<ApiResponse> {
		const tag = req.params.tag || req.query.tag || req.body.tag;
		if (!tag) {
			return { type: "error", message: "no tag included" };
		}

		const description = req.body.description;
		if (!description) {
			return { type: "error", message: "no description included" };
		}

		const tagObj = await prisma.tag.findFirst({ where: { tag } });

		if (tagObj == null) {
			return { type: "error", message: "tag not found" };
		}

		await prisma.tagInfo.upsert({
			where: { tag_id: tagObj.id },
			create: { tag_id: tagObj.id, description },
			update: { description }
		});

		return { type: "success", result: { description } };
	}
}
