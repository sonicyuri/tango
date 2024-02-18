/** @format */

import { BooruPost, ShimmiePost } from "../models/BooruPost";
import { Util } from "../util/Util";
import { BooruRequest } from "./BooruRequest";
import { SearchFilterOptions } from "./SearchFilterOptions";

interface PostListResult {
	posts: ShimmiePost[];
	offset: number;
	total_results: number;
}

type PostListResponse = { type: "error"; message: string } | { type: "success"; result: PostListResult };

interface ArraySegment {
	offset: number;
	items: string[];
}

interface RunningRequest {
	offset: number;
	limit: number;
	index: number;
	promise: Promise<any>;
}

/**
 * Represents a listing of posts of which only a subset is currently loaded.
 */
export class SparsePostArray {
	// the offset between blocks we expect
	// the array will try to maintain segments of this size while querying for new pages
	private readonly blockSize: number;
	private query: string;

	private posts: { [id: string]: BooruPost };
	// the currently filled segments of this array, kept sorted by start offset
	private segments: ArraySegment[];

	// the maximum posts that are available to load
	private limit: number = Number.MAX_VALUE;

	// the next request index to assign
	private requestIndex: number = 0;
	private runningRequests: RunningRequest[] = [];

	/**
	 * Creates a new {@link SparsePostArray} from an existing array, using a new block size.
	 * @param oldArray The array to copy from.
	 * @param newBlockSize The block size of the new array.
	 */
	static copyResize(oldArray: SparsePostArray, newBlockSize: number): SparsePostArray {
		const newArray = new SparsePostArray(oldArray.query, newBlockSize);
		oldArray.segments.forEach(s => {
			newArray.add(
				s.offset,
				s.items.map(id => oldArray.posts[id])
			);
		});

		return newArray;
	}

	/**
	 * Creates a new {@link SparsePostArray}.
	 * @param query The query this array represents.
	 * @param blockSize The block size that will be used.
	 */
	constructor(query: string, blockSize: number) {
		this.posts = {};
		this.segments = [];
		this.blockSize = blockSize;
		this.query = query;
	}

	/**
	 * The total count of posts in the query this array represents.
	 * @remark The length will be {@link Number.MAX_VALUE} until the first request is made.
	 */
	public get length() {
		return this.limit;
	}

	/**
	 * Whether a post with the given ID is currently contained in the {@link SparsePostArray}.
	 */
	public hasPost(id: string): boolean {
		return this.posts[id] !== undefined;
	}

	/**
	 * Returns the offset of the given post into this array, if present.
	 * @param id The post to find.
	 */
	public findPostOffset(id: string): number | null {
		for (let i = 0; i < this.segments.length; i++) {
			const s = this.segments[i];
			const postIndex = s.items.indexOf(id);
			if (postIndex != -1) {
				return s.offset + postIndex;
			}
		}

		return null;
	}

	/**
	 * Obtains the position of the given post in this array, in `[page, index]` form used by {@link PostSearchCursor}.
	 * @param id The post to find.
	 * @returns The position of the post in `[page, index]` form, or null if not found.
	 */
	public findCursorPosition(id: string): [number, number] | null {
		const postOffset = this.findPostOffset(id);
		if (postOffset == null) {
			return null;
		}

		const page = Math.floor(postOffset / this.blockSize);
		const index = postOffset - page * this.blockSize;
		return [page + 1, index];
	}

	/**
	 * Obtains a range of posts from the array, loading missing posts where needed.
	 * @param offset The offset into the array to obtain posts from.
	 * @param limit The maximum number of posts to return.
	 * @param force If true, new posts will always be fetched even if they've already been loaded.
	 */
	public async getRange(offset: number, limit: number, force: boolean): Promise<BooruPost[]> {
		// new blocks we need to load
		let neededBlocks: { [blockSize: number]: boolean } = {};
		// don't try to load posts we already know don't exist
		limit = Math.min(this.limit, limit);

		if (force) {
			const start = Math.floor(offset / this.blockSize);
			const end = Math.floor((offset + limit) / this.blockSize) + 1;
			for (let i = start; i < end; i += this.blockSize) {
				neededBlocks[i * this.blockSize] = true;
			}
		} else {
			for (let i = 0; i < limit; i++) {
				// if we don't have this index, we need to load its block
				// a little wasteful to loop through to check for every post, but i can't think of a smarter way right now
				if (!this.hasIndex(offset + i)) {
					const blockIndex = Math.floor((offset + i) / this.blockSize) * this.blockSize;
					neededBlocks[blockIndex] = true;
				}
			}
		}

		// load any missing blocks
		const neededBlockOffsets = Object.keys(neededBlocks).map(offset => Number(offset));
		let promises = neededBlockOffsets.map(b => this.loadBlock(b));

		// fetch all needed blocks
		await Promise.all(promises);

		// now actually grab our posts!
		let result: BooruPost[] = [];
		for (let i = 0; i < this.segments.length; i++) {
			const s = this.segments[i];
			let startIndex = 0;
			let numToRead = limit;

			if (
				// if there's any overlap, copy them over
				(s.offset <= offset && s.offset + s.items.length > offset) ||
				(s.offset > offset && s.offset < offset + limit)
			) {
				startIndex = Math.max(0, offset - s.offset);
				numToRead = Math.min(limit - result.length, s.items.length - startIndex);
				for (let j = startIndex; j < startIndex + numToRead; j++) {
					result.push(this.posts[s.items[j]]);
				}
			}

			if (result.length >= limit) {
				break;
			}
		}

		return result;
	}

	/**
	 * Gets the post at the provided index if it's in the {@link SparsePostArray}, or null if failed.
	 */
	public getAtIndex(index: number): BooruPost | null {
		for (let i = 0; i < this.segments.length; i++) {
			const s = this.segments[i];
			if (s.offset > index) {
				break;
			}

			if (s.offset <= index && s.offset + s.items.length > index) {
				return this.posts[s.items[index - s.offset]];
			}
		}

		return null;
	}

	/**
	 * Gets the post with the given ID currently contained in this {@link SparsePostArray}, or null if failed.
	 */
	public getAtId(id: string): BooruPost | null {
		return this.posts[id];
	}

	/**
	 * Begins a load for the block at the given offset.
	 */
	public preload(offset: number) {
		const blockOffset = Math.floor(offset / this.blockSize) * this.blockSize;
		this.loadBlock(blockOffset);
	}

	/**
	 * Adds a set of posts to the {@link SparsePostArray}.
	 * @param offset The offset that these posts start at.
	 * @param posts The posts to add.
	 */
	public add(offset: number, posts: BooruPost[]) {
		// store posts
		posts.forEach(p => {
			this.posts[p.id] = p;
		});

		let postIds = posts.map(p => p.id);
		let isOverlapped = false;

		for (let i = 0; i < this.segments.length; i++) {
			let s = this.segments[i];

			// overlaps start of segment
			// we have to handle this specially because pruneSegments will override later segments with earlier segments
			// so we don't care if we overlap later ones because we'll win, but we want these posts to win over the existing ones
			if (s.offset < offset && s.offset + s.items.length > offset) {
				const overlappingNum = s.offset + s.items.length - offset;
				// remove overlapping elements from old segment
				s.items.splice(s.items.length - overlappingNum, overlappingNum);
				// add new items at the end
				s.items = s.items.concat(postIds);
				isOverlapped = true;
				break;
			}
		}

		if (!isOverlapped) {
			// add as new segment
			this.segments.push({ offset, items: posts.map(p => p.id) });
		}

		this.pruneSegments();
	}

	/**
	 * Updates an existing post, or adds a new post without a position in the blocks.
	 */
	public addOrUpdatePost(post: BooruPost) {
		this.posts[post.id] = post;
	}

	/**
	 * Whether the given index is currently contained in the {@link SparsePostArray}.
	 */
	public hasIndex(index: number): boolean {
		if (index < 0) {
			return false;
		}

		for (let i = 0; i < this.segments.length; i++) {
			const segment = this.segments[i];
			if (segment.offset > index) {
				// too far, it's not here!
				break;
			}

			if (segment.offset <= index && segment.offset + segment.items.length > index) {
				return true;
			}
		}

		return false;
	}

	private loadBlock(offset: number): Promise<void> {
		for (let i = 0; i < this.runningRequests.length; i++) {
			const req = this.runningRequests[i];
			if (req.offset == offset && req.limit == this.blockSize) {
				// we have an ongoing request for this block
				return req.promise;
			}
		}

		const params = Util.objectToUrlParams({
			query: this.query || "",
			offset,
			limit: this.blockSize,
			filter: SearchFilterOptions.instance.getContentTypes()
		});

		const url = "/post/list?" + params.toString();
		const requestIndex = this.requestIndex++;

		let promise = BooruRequest.runQueryJsonV2(url)
			.then(j => {
				const res = j as PostListResponse;
				if (res.type == "error") {
					return Promise.reject(new Error(res.message));
				} else {
					return res.result;
				}
			})
			.then(res => {
				this.limit = res.total_results;
				const thisRequestIndex = this.runningRequests.findIndex(req => req.index == requestIndex);
				// remove this running request
				this.runningRequests.splice(thisRequestIndex, 1);
				const posts = res.posts.map(p => new BooruPost(p));
				this.add(res.offset, posts);
			});

		this.runningRequests.push({
			index: requestIndex,
			promise,
			offset,
			limit: this.blockSize
		});

		return promise;
	}

	// merges segments as needed
	private pruneSegments() {
		// ensure sorted
		this.segments.sort((a, b) => a.offset - b.offset);

		let segmentsToDelete: ArraySegment[] = [];
		let lastFilledIndex = 0;
		let lastSegment: ArraySegment | null = null;
		for (let i = 0; i < this.segments.length; i++) {
			let segment = this.segments[i];
			// if we're overlapping the last segment
			if (lastSegment != null && segment.offset < lastFilledIndex) {
				const thisSegmentOffset = lastFilledIndex - segment.offset;

				// copy all our items to the last segment
				for (let j = thisSegmentOffset; j < segment.items.length; j++) {
					lastSegment.items.push(segment.items[j]);
				}

				// mark this segment for deletion
				segmentsToDelete.push(segment);
				lastFilledIndex += segment.items.length - thisSegmentOffset;
			} else {
				lastFilledIndex = segment.offset + segment.items.length;
			}

			lastSegment = segment;
		}

		// remove marked segments from array
		segmentsToDelete.forEach(s => {
			const idx = this.segments.indexOf(s);
			this.segments.splice(idx, 1);
		});
	}
}
