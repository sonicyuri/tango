/** @format */

import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "./App";
import { Provider } from "react-redux";
import { Store } from "./features/Store";
import { setUpNotifications } from "reapop";
import { ThemeProvider } from "@mui/material";
import theme, { BodyFonts } from "./MuiTheme";

setUpNotifications({
	defaultProps: {
		position: "bottom-right",
		dismissible: true,
		dismissAfter: 5000
	}
});

ReactDOM.render(
	<React.StrictMode>
		<Provider store={Store}>
			<ThemeProvider theme={theme}>
				<div style={{ fontFamily: BodyFonts }}>
					<App />
				</div>
			</ThemeProvider>
		</Provider>
	</React.StrictMode>,
	document.getElementById("root")
);
