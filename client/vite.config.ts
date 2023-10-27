/** @format */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import fs from "fs";

import { createHtmlPlugin } from "vite-plugin-html";

const configFile = fs.existsSync("./config.json") ? JSON.parse(fs.readFileSync("./config.json", "utf8")) : {};
const endpoints = configFile.endpoints || {};

const getEndpointUrl = (key: string): string => {
	const env = process.env.NODE_ENV || "development";

	const endpointConfig = endpoints[key];
	if (!endpointConfig) {
		return "";
	}

	if (endpointConfig[env]) {
		return endpointConfig[env];
	}

	if (endpointConfig["development"]) {
		return endpointConfig["development"];
	}

	const keys = Object.keys(endpointConfig);
	if (keys.length > 0) {
		return endpointConfig[keys[0]];
	}

	return "";
};

export default defineConfig({
	plugins: [
		react(),
		viteTsConfigPaths(),
		svgrPlugin(),
		createHtmlPlugin({
			entry: "/src/index.tsx",
			template: "index.html",
			inject: {
				data: {
					tangoConfig: {
						endpoints: {
							v1: getEndpointUrl("v1"),
							v2: getEndpointUrl("v2")
						},
						storage: configFile.storage || {}
					}
				}
			}
		})
	],
	base: "/"
});
