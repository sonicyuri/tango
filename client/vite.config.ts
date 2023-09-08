/** @format */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";

export default defineConfig({
	plugins: [react(), viteTsConfigPaths(), svgrPlugin()],
	optimizeDeps: {
		include: ["@mui/icons-material", "@emotion/react", "@emotion/styled", "@mui/material/Unstable_Grid2"]
	},
	resolve: {
		alias: { "@mui/material/Unstable_Grid2": "@mui/material/Unstable_Grid2/Grid2" }
	}
});
