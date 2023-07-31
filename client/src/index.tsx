/** @format */

import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "./App";
import { Provider } from "react-redux";
import { Store } from "./features/Store";
import { setUpNotifications } from "reapop";
import { ThemeProvider, createTheme } from "@mui/material";

setUpNotifications({
	defaultProps: {
		position: "bottom-right",
		dismissible: true,
		dismissAfter: 5000
	}
});

const BodyFonts = [
	"Palanquin",
	"sans-serif"
].join(",");

const HeaderFonts = [
	"'Source Sans 3'",
	"Palanquin",
	"sans-serif"
].join(",");

const theme = createTheme({
	palette: {
		mode: "dark",
		primary: {
			main: "#D640CC"
		},
		secondary: {
			main: "#2BD6C3"
		}
	},
	typography: {
		fontFamily: BodyFonts,
		h1: { fontFamily: HeaderFonts },
		h2: { fontFamily: HeaderFonts },
		h3: { fontFamily: HeaderFonts },
		h4: { fontFamily: HeaderFonts },
		h5: { fontFamily: HeaderFonts },
		h6: { fontFamily: HeaderFonts },
		subtitle2: { fontWeight: 700 }
	} 
});

ReactDOM.render(
	<React.StrictMode>
		<Provider store={Store}>
			<ThemeProvider theme={theme}>
				<App />
			</ThemeProvider>
		</Provider>
	</React.StrictMode>,
	document.getElementById("root")
);
