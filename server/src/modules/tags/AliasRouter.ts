/** @format */
import express, { Request, Response, Router } from "express";
import { injectable } from "tsyringe";

import { IRouter } from "../../IRouter";
import { prisma } from "../../Prisma";
import ApiAsyncHandler, { ApiResponse } from "../../util/ApiAsyncHandler";
import { getUserFromToken, requirePermissions } from "../users/Middleware";
import { PrismaClient } from ".prisma/client";

interface EditAliasRequest {
	add?: { [oldTag: string]: string };
	remove?: string[];
}

@injectable()
export class TagAliasRouter implements IRouter {
	createRouter(): Router {
		const router = express.Router();

		router.use(getUserFromToken(true), requirePermissions("manage_alias_list"));

		// GET returns { [oldTag: string]: string }
		router.get("/list", ApiAsyncHandler(this.handleListAliases.bind(this)));

		// POST { add: { [oldTag: string]: string }, remove: string[] }
		router.post("/edit", ApiAsyncHandler(this.handleEditAliases.bind(this)));

		return router;
	}

	private async handleEditAliases(req: Request, res: Response): Promise<ApiResponse> {
		const params = req.body as EditAliasRequest;
		if (!params || (!params.add && !params.remove)) {
			return { type: "error", message: "no edits given" };
		}

		await prisma.alias.deleteMany({ where: { oldtag: { in: params.remove } } });

		await Promise.all(
			Object.keys(params.add || {}).map(async k => {
				const newTag = (params.add || {})[k];
				await prisma.alias.upsert({
					where: { oldtag: k },
					update: { newtag: newTag },
					create: { oldtag: k, newtag: newTag }
				});
			})
		);

		return { type: "success", result: await this.getAliasesMap(prisma) };
	}

	private async handleListAliases(req: Request, res: Response): Promise<ApiResponse> {
		return { type: "success", result: await this.getAliasesMap(prisma) };
	}

	private async getAliasesMap(prisma: PrismaClient): Promise<{ [oldTag: string]: string }> {
		const aliases = await prisma.alias.findMany();
		const aliasesMap: { [oldTag: string]: string } = {};
		aliases.forEach(a => (aliasesMap[a.oldtag] = a.newtag));
		return aliasesMap;
	}
}
