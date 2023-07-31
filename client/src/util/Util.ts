/** @format */

import { Breakpoint, useMediaQuery, useTheme } from "@mui/material";
import { Theme } from "@mui/system";
import base64 from "base-64";
import moment from "moment";

export enum LoadingState {
	Unloaded,
	Waiting,
	Loaded
}

export class Util {
	static chooseBreakpoint<T>(defaultVal: T, obj: { [k in Breakpoint]?: T }): T 
	{
		const theme: Theme = useTheme();

		const keys: Breakpoint[] = ["xl", "lg", "md", "sm", "xs"];
		for (const k in keys) 
		{
			const bp = k as Breakpoint;

			if (obj[bp] !== undefined && useMediaQuery(theme.breakpoints.up(bp))) 
			{
				return obj[bp] || defaultVal;
			}
		}

		return defaultVal;
	}

	static formatDate(date: Date): string
	{
		return moment(date).format("MMMM Do YYYY, h:mm:ss a");
	}
}
