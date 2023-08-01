/** @format */

import { ShimmieImage, BooruImage } from "../models/BooruImage";
import base64 from "base-64";
import { Logger, LogFactory } from "../util/Logger";
import { ImageSearchCursor } from "../ImageSearchCursor";

const BASE_URL = "https://booru.anime.lgbt";

export class CredentialsInvalidError extends Error {
	constructor(message: string) 
	{
		super(message);

		Object.setPrototypeOf(this, CredentialsInvalidError.prototype);
	}
}

class BooruRequest {
	private static authHeader: string | null = null;
	private static username: string;
	private static logger: Logger = LogFactory.create("BooruRequest");

	static init(username: string, password: string): void 
	{
		this.username = username;
		this.authHeader = "Basic " + base64.encode(`${username}:${password}`);
	}

	static runQuery(url: string, method: string, body: URLSearchParams | undefined): Promise<Response> 
	{
		const headers = new Headers();
		headers.append("Authorization", this.authHeader || "");
		return fetch(BASE_URL + url, {
			method: method,
			headers: headers,
			body: body
		}).then(res => {
			if (res.status == 403) 
			{
				return Promise.reject(new CredentialsInvalidError("HTTP Basic credentials rejected!"));
			}

			return res;
		});
	}

	static runGetQuery(url: string): Promise<Response>
	{
		return this.runQuery(url, "GET", undefined);
	}

	static runQueryJson(url: string): Promise<any> 
	{
		return this.runGetQuery(url).then(res => res.json());
	}

	static searchImages(query: string | null, page = 1): ImageSearchCursor 
	{
		const cursor = new ImageSearchCursor(query);
		cursor.setCursorPosition(Math.max(page, 1), 0);
		return cursor;
	}
}

export { BooruRequest };
