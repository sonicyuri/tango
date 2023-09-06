/** @format */

import fs from "fs";

export interface ServerConfig {
	port?: number;
	endpoint?: string;
	token_secret?: string;
}

export class Config {
	server?: ServerConfig;
	environment: string = "development";
}

export default function readConfig(): Config {
	const cachedConfig = (global as any).cachedConfig;
	if (cachedConfig != null) {
		return cachedConfig as Config;
	}

	const baseConfig: Config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
	baseConfig.server = baseConfig.server || {};
	baseConfig.server.token_secret = process.env.TOKEN_SECRET || baseConfig.server.token_secret;
	baseConfig.environment = process.env.NODE_ENV || baseConfig.environment;

	(global as any).cachedConfig = baseConfig;
	return baseConfig as Config;
}
