/** @format */
import { Alert, Breakpoint, useMediaQuery, useTheme } from "@mui/material";
import { Theme } from "@mui/system";
import { filesize } from "filesize";
import moment from "moment";

import { Logger } from "./Logger";

export enum LoadingState {
	Unloaded,
	Waiting,
	Loaded
}

export class Util {
	static chooseBreakpoint<T>(defaultVal: T, obj: { [k in Breakpoint]?: T }): T {
		const theme: Theme = useTheme();

		const keys: Breakpoint[] = ["xl", "lg", "md", "sm", "xs"];
		for (const k in keys) {
			const bp = k as Breakpoint;

			if (obj[bp] !== undefined && useMediaQuery(theme.breakpoints.up(bp))) {
				return obj[bp] || defaultVal;
			}
		}

		return defaultVal;
	}

	static formatDate(date: Date): string {
		return moment(date).format("MMMM Do YYYY, h:mm:ss a");
	}

	static formatBytes(bytes: number): string {
		return String(filesize(bytes, { output: "string" }));
	}

	static logAndDisplayError(logger: Logger, message: string, ...extraContents: any[]) {
		logger.error(message, ...extraContents);
		return <Alert severity="error">{message}</Alert>;
	}

	/**
	 * Produces a formatted query string out of the given set of parts.
	 * @param parts The keys and values of the query string, with an optional "enabled" parameter to if it should be included.
	 * @returns The formatted query string, like ?k1=v1&k2=v2&k3=v3
	 */
	static formatQueryString(parts: { key: string; value: string; enabled?: boolean }[]): string {
		let formatted = parts
			.filter(p => p.enabled || p.enabled === undefined)
			.map(p => `${p.key}=${encodeURIComponent(p.value)}`)
			.join("&");
		return formatted.length > 0 ? "?" + formatted : "";
	}

	static isTouchDevice(): boolean {
		return "ontouchstart" in window || navigator.maxTouchPoints > 0;
	}

	/**
	 * Creates a link to the posts page with the given information.
	 */
	static makePostsLink(query: string | null, page: number): string {
		const queryString = Util.formatQueryString([{ key: "q", value: query?.trim() || "", enabled: Boolean(query) }]);
		return `/posts${page != 1 ? "/" + page : ""}${queryString}`;
	}
}
