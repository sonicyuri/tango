/** @format */

import { BooruRequest } from "./features/BooruRequest";
import { BooruImage, ShimmieImage } from "./models/BooruImage";

interface ShimmieFindImagesV2 {
	images: ShimmieImage[];
	total_pages: number;
}

// how many posts from the edges before we preload the next page
const PagePostPreloadThreshold = 5;

/**
 * Handles navigating a search query from post list and post view modes.
 *
 * TODO: handle new posts being added while browsing. cache miss mode?
 */
export class ImageSearchCursor {
	private query: string | null;
	private pagesCache: { [page: number]: BooruImage[] };
	private runningPromises: { [page: number]: Promise<void> };
	// cursor pos in page, index
	private cursorPos: [number, number];
	// no pages after this
	private maxPage: number = Number.MAX_VALUE;
	// the max page size seen so far in this query
	private maxPageSize = 0;

	constructor(query: string | null) 
	{
		this.query = query;
		this.pagesCache = {};
		this.runningPromises = {};
		this.cursorPos = [1, 0];
	}

	/**
	 * Gets the current cursor position.
	 * @returns [page, index]
	 */
	public get cursorPosition(): [number, number] 
	{
		return this.cursorPos;
	}

	public get pageCount(): number 
	{
		return this.maxPage;
	}

	public get currentQuery(): string | null 
	{
		return this.query;
	}

	// for setting the position of the cursor. will preload relevant pages
	public setCursorPosition(page: number, index: number): void 
	{
		this.preload(page);
		if (page < this.maxPage) 
		{
			this.preload(page + 1);
		}
		if (page > 1) 
		{
			this.preload(page - 1);
		}
		this.cursorPos = [page, index];
	}

	// sets the index component of the cursor directly
	public setCursorIndex(index: number): void 
	{
		this.cursorPos[1] = index;

		const currentPage = this.cursorPos[0];

		// preload the next page if we need to
		if (this.maxPageSize - index + 1 < PagePostPreloadThreshold && this.maxPage > currentPage) 
		{
			this.preload(currentPage + 1);
		}

		if (index < PagePostPreloadThreshold && currentPage > 1) 
		{
			this.preload(currentPage - 1);
		}
	}

	// returns the image the cursor is currently pointing at
	public async getImageAtCursor(): Promise<BooruImage> 
	{
		const [page, index] = this.cursorPos;
		const pageImages = await this.getImages(page);
		return pageImages[index];
	}

	public getImagesAtCursor(): Promise<BooruImage[]> 
	{
		return this.getImages(this.cursorPos[0]);
	}

	// can the cursor be moved in this direction?
	public canMove(movement: -1 | 1): boolean 
	{
		const [page, index] = this.cursorPos;
		if (movement == -1) 
		{
			return page > 1 || index > 1;
		} 
		else 
		{
			return page < this.maxPage || index < this.maxPageSize - 1;
		}
	}

	// moves cursor forwards or backwards and returns the image at that point
	public async moveCursorAndReturn(movement: -1 | 1): Promise<BooruImage> 
	{
		if (!this.canMove(movement)) 
		{
			return Promise.reject(new Error("No more images!"));
		}

		let [page, index] = this.cursorPos;
		let pageImages = await this.getImages(page);
		index += movement;
		if (index > pageImages.length - 1) 
		{
			page += 1;
			index = 0;
			pageImages = await this.getImages(page);
		} 
		else if (index < 0) 
		{
			page -= 1;
			pageImages = await this.getImages(page);
			index = pageImages.length - 1;
		}

		this.cursorPos = [page, index];
		return pageImages[index];
	}

	public async getImages(page: number): Promise<BooruImage[]> 
	{
		if (page > this.maxPage) 
		{
			page = this.maxPage;
		}

		if (this.runningPromises[page] !== undefined) 
		{
			await this.runningPromises[page];
		}

		if (this.pagesCache[page] === undefined) 
		{
			await this.load(page);
		}

		return this.pagesCache[page];
	}

	// start a page loading
	public preload(page: number): void 
	{
		if (page > 0 && this.pagesCache[page] === undefined) 
		{
			this.load(page);
		}
	}

	private load(page: number): Promise<void> 
	{
		if (this.runningPromises[page] !== undefined) 
		{
			return this.runningPromises[page];
		}

		const url =
			this.query !== null
				? `/api/shimmie/find_images_v2/${encodeURIComponent(this.query)}/${page}`
				: `/api/shimmie/find_images_v2/${page}`;

		this.runningPromises[page] = BooruRequest.runQueryJson(url)
			.then(j => {
				const res = j as ShimmieFindImagesV2;
				this.maxPage = res.total_pages;
				return res.images.map(i => new BooruImage(i));
			})
			.then(images => {
				this.pagesCache[page] = images;
				this.maxPageSize = Math.max(images.length, this.maxPageSize);
			})
			.finally(() => delete this.runningPromises[page]);

		return this.runningPromises[page];
	}
}
