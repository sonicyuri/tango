/** @format */
import { Alert, useMediaQuery } from "@mui/material";
import { Theme, Breakpoint, useTheme } from "@mui/system";
import { filesize } from "filesize";
import moment, { ISO_8601 } from "moment";
import React from "react";
import i18n from "./Internationalization";

import { Logger } from "./Logger";

export enum LoadingState {
	Unloaded,
	Waiting,
	Loaded
}

type AddableObject = { [k: string]: number };

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
		const formatted = parts
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
		const queryString = Util.formatQueryString([
			{
				key: "q",
				value: query?.trim() || "",
				enabled: Boolean(query)
			}
		]);
		return `/posts${page != 1 ? "/" + page : ""}${queryString}`;
	}

	static samePageLinkNavigation(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
		return !(
			event.defaultPrevented ||
			event.button !== 0 || // ignore everything but left-click
			event.metaKey ||
			event.ctrlKey ||
			event.altKey ||
			event.shiftKey
		);
	}

	static formatTitle(str: string) {
		return i18n.t("siteTitle") + " | " + str;
	}

	static checkIfTokenValid(expiration: string): boolean {
		if (expiration.length == 0) {
			return false;
		}

		return moment(expiration).isAfter(moment());
	}

	static formatTag(tag: string): string {
		return tag.replace(/_/g, " ");
	}

	static stripTagCategory(tag: string): string {
		return tag.indexOf(":") != -1 ? tag.split(":")[1] : tag;
	}

	static arrayToObject<T, U, V>(array: T[], func: (val: T) => [string, U]): { [k: string]: U } {
		const obj: { [k: string]: U } = {};
		array.forEach(v => {
			const t = func(v);
			obj[t[0]] = t[1];
		});

		return obj;
	}

	static addObjects(...objects: AddableObject[]): AddableObject {
		const accum: AddableObject = {};
		objects.forEach(obj => {
			Object.keys(obj).forEach(k => (accum[k] = (accum[k] || 0) + obj[k]));
		});

		return accum;
	}
}
