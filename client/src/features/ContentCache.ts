/** @format */

import { BooruPost } from "../models/BooruPost";
import { bytesToBase64 } from "../util/Base64";

interface CacheEntry {
	contentDataUrl: string;
	mime: string;
}

interface PendingCacheEntry {
	progress: number;
	promise: Promise<CacheEntry>;
}

export type ContentCacheResult =
	| { status: "loading"; progress: number }
	| { status: "completed"; entry: CacheEntry };

export class ContentCache {
	private static _entries: Record<string, CacheEntry> = {};
	private static _entryLastUpdated: Record<string, Date> = {};
	private static _pendingEntries: Record<string, PendingCacheEntry> = {};

	public static currentScreen: "list" | "view" = "list";

	static preload(posts: BooruPost[]) {
		posts.forEach(p => {
			ContentCache.loadContent(
				ContentCache.currentScreen === "list" ? p.thumbUrl : p.videoUrl,
				p.mimeType
			);
		});
	}

	static get(post: BooruPost): ContentCacheResult {
		return this.getCacheEntry(post.videoUrl, post.mimeType);
	}

	private static getCacheEntry(
		url: string,
		mime: string
	): ContentCacheResult {
		if (this._entries[url]) {
			return { status: "completed", entry: this._entries[url] };
		}

		if (!this._pendingEntries[url]) {
			this.loadContent(url, mime);
		}

		return {
			status: "loading",
			progress: this._pendingEntries[url].progress ?? 0
		};
	}

	private static async loadContent(url: string, mime: string) {
		if (this._entries[url]) {
			this._entryLastUpdated[url] = new Date();
			return this._entries[url];
		}

		if (this._pendingEntries[url]) {
			return await this._pendingEntries[url].promise;
		}

		const pendingEntry: PendingCacheEntry = {
			progress: 0,
			promise: new Promise((resolve, _reject) => {
				const req = new XMLHttpRequest();
				req.responseType = "arraybuffer";
				req.onprogress = ev => {
					this._pendingEntries[url].progress = Math.min(
						Math.max(0, ev.loaded / ev.total),
						1
					);
				};
				req.open("GET", url);
				req.onreadystatechange = _ev => {
					if (req.readyState === 4) {
						const cacheEntry: CacheEntry = {
							mime,
							contentDataUrl: `data:${mime};base64,${bytesToBase64(
								new Uint8Array(req.response)
							)}`
						};
						this._entries[url] = cacheEntry;
						this._entryLastUpdated[url] = new Date();
						delete this._pendingEntries[url];
						resolve(cacheEntry);
					}
				};
				req.send();
			})
		};

		this._pendingEntries[url] = pendingEntry;
		return pendingEntry.promise;
	}
}
