/** @format */

import fs from "fs";

interface Config {
	s3AccessKey: string;
	s3SecretKey: string;
	s3Endpoint: string;
	s3Region: string;
	s3Bucket: string;
	mysqlHost: string;
	mysqlUser: string;
	mysqlPassword: string;
	mysqlDatabase: string;
	mysqlPort: number;
}

function readConfig(): Config | null {
	if (!fs.existsSync("config.json")) {
		return null;
	}

	return JSON.parse(fs.readFileSync("config.json", { encoding: "utf-8" }));
}

export { Config, readConfig };
