/** @format */

import { PrismaClient } from ".prisma/client";
import readConfig from "./Config";
import Util from "./util/Util";

const logger = Util.getLogger("Prisma");

const prismaClientSingleton = () => {
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
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default function usePrisma() {
	return prisma;
}
