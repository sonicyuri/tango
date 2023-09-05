/** @format */

import { BooruRequest } from "./BooruRequest";
import { BooruPost, ShimmiePost } from "../models/BooruPost";
import { Util } from "../util/Util";
import { current } from "immer";

interface ShimmieFindImagesV2 {
	images: ShimmiePost[];
	total_pages: number;
	page_number: number;
}

// how many posts from the edges before we preload the next page
const PagePostPreloadThreshold = 5;

/**
 * Handles navigating a search query from post list and post view modes.
 *
 * TODO: handle new posts being added while browsing. cache miss mode?
 */
export class PostSearchCursor {
	private query: string | null;
	// maps a page to an array of post ids
	// if a post id is in this array, it should always exist in the posts cache!
	private pagesCache: { [page: number]: string[] };
	private postsCache: { [id: string]: BooruPost };
	private runningPromises: { [page: number]: Promise<void> };
	// cursor pos in page, index
	private cursorPos: [number, number];
	// no pages after this
	private maxPage: number = Number.MAX_VALUE;
	// the max page size seen so far in this query
	private maxPageSize = 0;

	constructor(query: string | null) {
		this.query = query;
		this.pagesCache = {};
		this.postsCache = {};
		this.runningPromises = {};
		this.cursorPos = [1, 0];
	}

	public get pageCount(): number {
		return this.maxPage;
	}

	public get currentQuery(): string | null {
		return this.query;
	}

	/**
	 * Gets the current cursor position.
	 * @returns [page, index]
	 */
	public get cursorPosition(): [number, number] {
		return this.cursorPos;
	}

	// for setting the position of the cursor. will preload relevant pages
	public setCursorPosition(page: number, index: number): void {
		this.preload(page);
		if (this.maxPageSize - index + 1 < PagePostPreloadThreshold && this.maxPage > page) {
			this.preload(page + 1);
		}
		if (index < PagePostPreloadThreshold && page > 1) {
			this.preload(page - 1);
		}
		this.cursorPos = [page, index];
	}

	// sets the index component of the cursor directly
	public setCursorIndex(index: number): void {
		this.setCursorPosition(this.cursorPos[0], index);
	}

	public async loadAndSetCurrentPostById(postId: string) {
		if (!this.postsCache[postId]) {
			await this.load(1, postId);
		}

		this.setCurrentPostById(postId);
	}

	/**
	 * Finds the given post in the loaded pages and sets it as the current post.
	 */
	public setCurrentPostById(postId: string) {
		if (!this.postsCache[postId]) {
			return;
		}

		for (const key in this.pagesCache) {
			const index = this.pagesCache[key].indexOf(postId);
			if (index !== -1) {
				this.cursorPos = [Number(key), index];
				this.setCursorPosition(Number(key), index);
				break;
			}
		}
	}

	/**
	 * Returns the post the cursor is pointing at.
	 */
	public async getPostAtCursor(): Promise<BooruPost> {
		const [page, index] = this.cursorPos;
		const pageImages = await this.getPosts(page);
		return pageImages[index];
	}

	private getPostAtPosSync(page: number, index: number): BooruPost {
		return this.postsCache[this.pagesCache[page][index]];
	}

	/**
	 * Returns the posts on the current page the cursor is pointing at.
	 */
	public getPostsAtCursor(): Promise<BooruPost[]> {
		return this.getPosts(this.cursorPos[0]);
	}

	/**
	 * Creates a link to the current posts page this cursor is pointing to.
	 */
	public makePostsLink(): string {
		return Util.makePostsLink(this.currentQuery || "", this.cursorPos[0]);
	}

	/**
	 * Makes a link to a particular post based on the current cursor position.
	 */
	public makePostLink(post: BooruPost): string {
		const newQueryString = Util.formatQueryString([
			{
				key: "q",
				value: this.currentQuery || "",
				enabled: this.currentQuery != null
			},
			{
				key: "page",
				value: String(this.cursorPos[0]),
				enabled: this.cursorPos[0] != 1
			}
		]);

		return `/posts/view/${post.id}${newQueryString}`;
	}

	public makePostLinkNavigate(movement: -1 | 1): string {
		let [page, index] = this.cursorPos;
		if (!this.canMove(movement)) {
			return this.makePostLink(this.getPostAtPosSync(page, index));
		}

		index += movement;

		const pageContents = this.pagesCache[page];
		if (index >= pageContents.length) {
			page++;
			index = 0;
		} else if (index < 0) {
			page--;
			index = this.pagesCache[page].length - 1;
		}

		return this.makePostLink(this.getPostAtPosSync(page, index));
	}

	// can the cursor be moved in this direction?
	public canMove(movement: -1 | 1): boolean {
		const [page, index] = this.cursorPos;
		if (movement == -1) {
			return page > 1 || index > 0;
		} else {
			return page < this.maxPage || index < this.maxPageSize - 1;
		}
	}

	// moves cursor forwards or backwards and returns the post at that point
	public async moveCursorAndReturn(movement: -1 | 1): Promise<BooruPost> {
		if (!this.canMove(movement)) {
			return Promise.reject(new Error("No more posts!"));
		}

		let [page, index] = this.cursorPos;
		let pagePosts = await this.getPosts(page);
		index += movement;
		if (index > pagePosts.length - 1) {
			page += 1;
			index = 0;
			pagePosts = await this.getPosts(page);
		} else if (index < 0) {
			page -= 1;
			pagePosts = await this.getPosts(page);
			index = pagePosts.length - 1;
		}

		this.cursorPos = [page, index];
		return pagePosts[index];
	}

	/**
	 * Stores the given post in the internal post cache, updating the existing cache if present.
	 * This is used to inform the cursor of any posts fetched through getById or other means.
	 */
	public storeOrUpdatePost(post: BooruPost): void {
		this.postsCache[post.id] = post;
	}

	public async getPosts(page: number): Promise<BooruPost[]> {
		if (page > this.maxPage) {
			page = this.maxPage;
		}

		if (this.runningPromises[page] !== undefined) {
			await this.runningPromises[page];
		}

		if (this.pagesCache[page] === undefined) {
			await this.load(page);
		}

		return this.pagesCache[page].map(id => this.postsCache[id]);
	}

	// start a page loading
	public preload(page: number): void {
		if (page > 0 && this.pagesCache[page] === undefined) {
			this.load(page);
		}
	}

	private load(page: number, currentId: string | null = null): Promise<void> {
		if (this.runningPromises[page] !== undefined) {
			return this.runningPromises[page];
		}

		let url =
			this.query !== null
				? `/api/shimmie/find_images_v2/${encodeURIComponent(this.query)}/${page}`
				: `/api/shimmie/find_images_v2/${page}`;

		if (currentId != null) {
			url += "?current_id=" + currentId;
		}

		this.runningPromises[page] = BooruRequest.runQueryJson(url)
			.then(j => {
				const res = j as ShimmieFindImagesV2;
				this.maxPage = res.total_pages;
				return { page: res.page_number, images: res.images.map(i => new BooruPost(i)) };
			})
			.then(res => {
				const { images, page: newPage } = res;
				// store all the images in the posts cache and store the ids in the page cache
				images.forEach(img => (this.postsCache[img.id] = img));
				this.pagesCache[newPage] = images.map(img => img.id);
				this.maxPageSize = Math.max(images.length, this.maxPageSize);
				if (currentId != null) {
					this.setCurrentPostById(currentId);
				}
			})
			.finally(() => delete this.runningPromises[page]);

		return this.runningPromises[page];
	}
}
