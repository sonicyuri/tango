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
import readConfig, { Config } from "../../Config";
import usePrisma from "../../Prisma";

@injectable()
export class TagRouter implements IRouter {
	createRouter(): Router {
		const router = express.Router();

		// GET { tag?: string } returns { tags: { [tag: string]: number }, categories: TagCategory[] }
		router.get("/list/:tag", ApiAsyncHandler(this.handleList));
		router.get("/list", ApiAsyncHandler(this.handleList));

		return router;
	}

	private async handleList(req: Request, res: Response): Promise<ApiResponse> {
		const prisma = usePrisma();

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
}
