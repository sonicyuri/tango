/** @format */

import React from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "./App";
import { Provider } from "react-redux";
import { Store } from "./features/Store";
import { setUpNotifications } from "reapop";
import theme, { BodyFonts } from "./MuiTheme";
import { LogFactory } from "./util/Logger";
import { ThemeProvider } from "@emotion/react";
import { GlobalDispatcher } from "./features/GlobalDispatcher";

const logger = LogFactory.create("index");

setUpNotifications({
	defaultProps: {
		position: "bottom-right",
		dismissible: true,
		dismissAfter: 5000
	}
});

GlobalDispatcher.setDispatchCallback(Store.dispatch);

const container = document.getElementById("root");
if (container) {
	const root = createRoot(container);
	root.render(
		<Provider store={Store}>
			<ThemeProvider theme={theme}>
				<div style={{ fontFamily: BodyFonts }}>
					<App />
				</div>
			</ThemeProvider>
		</Provider>
	);
} else {
	logger.error("no container to put react app in?");
}
