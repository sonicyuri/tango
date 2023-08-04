/** @format */

import { createTheme } from "@mui/material";

export const BodyFonts = ["Palanquin", "sans-serif"].join(",");

export const HeaderFonts = ["'Source Sans 3'", "Palanquin", "sans-serif"].join(",");

const baseTheme = createTheme({
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
		subtitle1: { fontWeight: 700 },
		subtitle2: { fontWeight: 700 }
	}
});

// a derived theme for component overrides so they can access variables
const componentsTheme = createTheme(baseTheme, {
	components: {
		MuiLink: {
			styleOverrides: {
				root: {
					"&:hover": {
						color: baseTheme.palette.primary.dark
					}
				}
			}
		}
	}
});

export default componentsTheme;
