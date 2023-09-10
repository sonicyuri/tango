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
import * as http from "http";

export class Server {
	private app: express.Express;
	private server: http.Server | null = null;
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
		if (process.env.NODE_ENV !== "test") {
			this.app.use(expressPino());
		}
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
		this.server = this.app.listen(port, () => {
			this.logger.info(`server running on port ${port}`);
		});
	}

	async destroy(): Promise<void> {
		if (this.isDestroyed) {
			return;
		}

		await new Promise<void>((resolve, reject) => {
			if (this.server != null) {
				this.server.close(err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			}
		});
		this.isDestroyed = true;
	}
}
