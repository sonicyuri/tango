/** @format */

import { PrismaClient } from ".prisma/client";
import readConfig from "./Config";
import Util from "./util/Util";

const logger = Util.getLogger("Prisma");

const prismaClientSingleton = () => {
	const config = readConfig();

	const datasourceUrl = process.env.NODE_ENV == "test" ? process.env.TEST_DATABASE_URL : undefined;

	if (config.environment == "production" || process.env.NODE_ENV == "test") {
		return new PrismaClient({ datasourceUrl });
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
		],
		datasourceUrl
	});

	prisma.$on("query", e => {
		logger.info(`query ${e.query}, params ${e.params}, duration ${e.duration}`);
	});

	return prisma;
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClientSingleton | undefined;
};

export let prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export const recreatePrisma = () => {
	globalForPrisma.prisma = prisma = prismaClientSingleton();
};

if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") globalForPrisma.prisma = prisma;
