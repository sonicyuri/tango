/** @format */

import express, { Application } from "express";
import { Logger } from "pino";
import Util from "./util/Util";
import { container } from "tsyringe";
import expressPino from "express-pino-logger";
import BodyParser from "body-parser";
import { PrismaClient } from ".prisma/client";
import { UserRouter } from "./modules/users/Router";
import { IRouter } from "./IRouter";
import readConfig, { Config } from "./Config";
import { TagRouter } from "./modules/tags/Router";
import { TagAliasRouter } from "./modules/tags/AliasRouter";
import jsonResponse from "./util/JsonResponseMiddleware";
import { notFound } from "./util/NotFoundMiddleware";

export class Server {
	private app: express.Express;
	private prisma: PrismaClient;
	private config: Config;
	private logger: Logger;
	private isDestroyed: boolean;

	constructor() {
		this.app = express();

		this.logger = Util.getLogger("Server");
		this.isDestroyed = false;

		this.prisma = new PrismaClient();
		this.config = readConfig();

		container.register<PrismaClient>(PrismaClient, { useValue: this.prisma });
		container.register<Config>(Config, { useValue: this.config });

		process.on("exit", () => this.destroy());
	}

	async run() {
		this.app.use(BodyParser.json());
		this.app.use(expressPino());
		this.app.use(jsonResponse);

		const rootRouter = express.Router();

		const routes: { [endpoint: string]: IRouter } = {
			"/user": container.resolve(UserRouter),
			"/tag/alias": container.resolve(TagAliasRouter),
			"/tag": container.resolve(TagRouter)
		};

		Object.keys(routes).forEach(endpoint => rootRouter.use(endpoint, routes[endpoint].createRouter()));

		this.app.use(this.config.server?.endpoint ?? "/api", rootRouter);

		this.app.use(notFound);

		let port = this.config.server?.port ?? 3001;
		this.app.listen(port, () => {
			this.logger.info(`server running on port ${port}`);
		});
	}

	destroy(): void {
		if (this.isDestroyed) {
			return;
		}

		this.isDestroyed = true;
	}
}
