/** @format */

import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "./App";
import { Provider } from "react-redux";
import { Store } from "./features/Store";
import { setUpNotifications } from "reapop";
import { ThemeProvider } from "@mui/material/styles";
import theme, { BodyFonts } from "./MuiTheme";
import { Util } from "./util/Util";
import { LogFactory } from "./util/Logger";

const logger = LogFactory.create("index");

setUpNotifications({
	defaultProps: {
		position: "bottom-right",
		dismissible: true,
		dismissAfter: 5000
	}
});

const container = document.getElementById("root");
if (container) {
	const root = createRoot(container);
	root.render(
		<React.StrictMode>
			<Provider store={Store}>
				<ThemeProvider theme={theme}>
					<div style={{ fontFamily: BodyFonts }}>
						<App />
					</div>
				</ThemeProvider>
			</Provider>
		</React.StrictMode>
	);
} else {
	logger.error("no container to put react app in?");
}
