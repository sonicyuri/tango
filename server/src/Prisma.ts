/** @format */

import { PrismaClient } from ".prisma/client";
import readConfig from "./Config";
import Util from "./util/Util";

const logger = Util.getLogger("Prisma");

export default function usePrisma() {
	const config = readConfig();

	if (config.environment == "production") {
		return new PrismaClient();
	}

	const prisma = new PrismaClient({
		log: [
			{
				emit: "event",
				level: "query"
			},
			"info",
			"warn",
			"error"
		]
	});

	prisma.$on("query", e => {
		logger.info(`query ${e.query}, params ${e.params}, duration ${e.duration}`);
	});

	return prisma;
}
