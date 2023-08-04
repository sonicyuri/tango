/** @format */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";

export default defineConfig({
	plugins: [react(), viteTsConfigPaths(), svgrPlugin()]
});
