/** @format */

import { BooruPost, ShimmiePost } from "../models/BooruPost";
import { LocalSettings } from "../util/LocalSettings";
import { Util } from "../util/Util";
import { SparsePostArray } from "./SparsePostArray";

interface PostListResult {
	posts: ShimmiePost[];
	offset: number;
	total_results: number;
}

type PostListResponse =
	| { type: "error"; message: string }
	| { type: "success"; result: PostListResult };

// how many posts from the edges before we preload the next page
const PagePostPreloadThreshold = 5;

/**
 * Handles navigating a search query from post list and post view modes.
 *
 * @todo handle new posts being added while browsing. cache miss mode?
 */
export class PostSearchCursor {
	private currentPageSize: number;

	private query: string | null;
	private posts: SparsePostArray;

	private offset: number;

	constructor(
		query: string | null,
		pageSize: number | undefined = undefined,
		initialOffset: number = 0
	) {
		this.query = query;
		this.currentPageSize = pageSize || LocalSettings.pageSize.value;
		this.posts = new SparsePostArray(query || "", this.currentPageSize);
		this.offset = initialOffset;
	}

	public get pageCount(): number {
		return Math.ceil(this.posts.length / this.pageSize);
	}

	public get currentQuery(): string | null {
		return this.query;
	}

	/**
	 * The current page this cursor is pointing to.
	 */
	public get page(): number {
		return Math.floor(this.offset / this.pageSize) + 1;
	}

	/**
	 * The offset from the start of this page that this cursor is pointing to.
	 */
	public get pageOffset(): number {
		return this.offset - (this.page - 1) * this.pageSize;
	}

	/**
	 * Gets the current cursor position.
	 * @returns [page, index]
	 */
	public get cursorPosition(): [number, number] {
		return [this.page, this.pageOffset];
	}

	/**
	 * The current page size being used.
	 */
	public get pageSize(): number {
		return this.currentPageSize;
	}

	/**
	 * Sets the current offset of this cursor into the query, preloading relevant blocks.
	 */
	public setOffset(val: number) {
		this.offset = val;
		this.preloadOffset(this.offset);
		const pageCountOffset = Math.floor(this.offset / this.currentPageSize);
		const pageItemsOffset = pageCountOffset * this.currentPageSize;
		const prevPage = (pageCountOffset - 1) * this.currentPageSize;
		const nextPage = (pageCountOffset + 1) * this.currentPageSize;
		if (
			prevPage >= 0 &&
			this.offset - pageItemsOffset < PagePostPreloadThreshold
		) {
			this.preloadOffset(prevPage);
		}
		if (
			nextPage < this.posts.length &&
			this.pageSize - (this.offset - pageItemsOffset) <
				PagePostPreloadThreshold
		) {
			this.preloadOffset(nextPage);
		}
	}

	/**
	 * Sets the current page size.
	 */
	public async setPageSize(val: number) {
		this.currentPageSize = val;
		// make sure we have all the data we need to view
		// for ex, if the page size changed from 25 to 100, we might need to load way more to fill the page
		await this.posts.getRange(this.offset, this.currentPageSize, false);
	}

	/**
	 * Finds the given post in the loaded pages and sets it as the current post.
	 */
	public setCurrentPostById(postId: string): boolean {
		if (!this.posts.hasPost(postId)) {
			return false;
		}

		const newPos = this.posts.findPostOffset(postId);
		if (newPos != null) {
			this.setOffset(newPos);
			return true;
		}

		return false;
	}

	/**
	 * @see {@link SparsePostArray.hasPost}
	 */
	public hasPost(postId: string): boolean {
		return this.posts.hasPost(postId);
	}

	public getPostById(postId: string): BooruPost | null {
		return this.posts.getAtId(postId);
	}

	/**
	 * Returns the post the cursor is pointing at.
	 */
	public async getPostAtCursor(): Promise<BooruPost | null> {
		const pageImages = await this.posts.getRange(this.offset, 1, false);
		return pageImages.length > 0 ? pageImages[0] : null;
	}

	/**
	 * Returns the posts on the current page the cursor is pointing at.
	 */
	public getPostsAtCursor(): Promise<BooruPost[]> {
		return this.posts.getRange(
			this.getPageStartOffset(this.offset),
			this.pageSize,
			true
		);
	}

	/**
	 * Creates a link to the current posts page this cursor is pointing to.
	 */
	public makePostsLink(): string {
		return Util.makePostsLink(this.currentQuery || "", this.page);
	}

	/**
	 * Makes a link to a particular post based on the current cursor position.
	 */
	public makePostLink(post: BooruPost): string {
		const offsetVal = this.getPageStartOffset(this.offset);
		const newQueryString = Util.formatQueryString([
			{
				key: "q",
				value: this.currentQuery || "",
				enabled: this.currentQuery != null
			},
			{
				key: "offset",
				value: String(offsetVal),
				enabled: offsetVal != 0
			}
		]);

		return `/posts/view/${post.id}${newQueryString}`;
	}

	/**
	 * Creates a post link to use for navigation.
	 * @param movement The direction to move, either -1 (previous) or 1 (next)
	 * @returns The generated post link.
	 */
	public makePostLinkNavigate(movement: -1 | 1): string {
		let offset = this.offset;
		if (this.canMove(movement)) {
			offset += movement;
		}

		const thisPost = this.posts.getAtIndex(offset);
		return thisPost == null
			? this.makePostsLink()
			: this.makePostLink(thisPost);
	}

	/**
	 * Can the cursor be moved in this direction?
	 */
	public canMove(movement: -1 | 1): boolean {
		return this.posts.hasIndex(this.offset + movement);
	}

	/**
	 * Stores the given post in the internal post cache, updating the existing cache if present.
	 * This is used to inform the cursor of any posts fetched through getById or other means.
	 */
	public storeOrUpdatePost(post: BooruPost): void {
		this.posts.addOrUpdatePost(post);
	}

	/**
	 * Reloads the current query with fresh data.
	 */
	public async reload() {
		this.posts = new SparsePostArray(
			this.query || "",
			this.currentPageSize
		);
		await this.posts.getRange(
			this.getPageStartOffset(this.offset),
			this.pageSize,
			true
		);
		// fix cursor if it's now pointing to an invalid position
		if (!this.posts.hasIndex(this.offset)) {
			this.offset = this.posts.length - 1;
		}
	}

	private preloadOffset(offset: number): void {
		if (!this.posts.hasIndex(offset)) {
			this.posts.preload(offset);
		}
	}

	private getPageStartOffset(offset: number): number {
		return Math.floor(offset / this.currentPageSize) * this.currentPageSize;
	}
}
