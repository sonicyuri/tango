/** @format */

import getTangoConfig from "../TangoConfig";
import { LogFactory, Logger } from "../util/Logger";

const logger: Logger = LogFactory.create("BooruPost");

const TangoConfig = getTangoConfig();
const StorageConfig = TangoConfig.storage;
if (StorageConfig.type !== "s3") {
	throw new Error(`Unknown storage type ${StorageConfig.type}`);
}

const BaseUrl = StorageConfig.base_url;
if (BaseUrl === undefined) {
	throw new Error(`Missing base URL`);
}

interface ShimmiePost {
	id: string;
	width: number;
	height: number;
	hash: string;
	filesize: number;
	ext: string;
	mime: string;
	posted: number;
	source: string | null;
	owner_id: string;
	numeric_score: number;
	tags?: string[];
	views?: number;
	pools: number[];
}

class BooruPost {
	/**
	 * This post's ID.
	 */
	public id: string;
	/**
	 * The size in pixels, if applicable, of this post's content.
	 */
	public imageSize: [number, number];
	/**
	 * The md5 hash of this post's content.
	 */
	public hash: string;
	/**
	 * The size in bytes of this post's content.
	 */
	public fileSize: number;
	/**
	 * The original file extension of this post's content.
	 * @deprecated Use {@link mimeType} instead.
	 */
	public extension: string;
	/**
	 * The mime type of this post's content.
	 */
	public mimeType: string;
	/**
	 * The date this post was made.
	 */
	public postedAt: Date;
	/**
	 * The source of the post.
	 */
	public source: string | null;
	/**
	 * The sum of all this post's upvotes and downvotes.
	 */
	public numericScore: number;
	/**
	 * The ID of the user who made this post.
	 */
	public ownerId: string;
	/**
	 * All the tags added to the post.
	 */
	public tags: string[];
	/**
	 * The number of times this post has been viewed.
	 */
	public views: number;

	constructor(obj: ShimmiePost) {
		this.id = String(obj.id);
		this.imageSize = [obj.width, obj.height];
		this.hash = obj.hash;
		this.fileSize = obj.filesize;
		this.extension = obj.ext;
		this.mimeType = obj.mime;
		this.postedAt = new Date(obj.posted * 1000);
		this.source = obj.source;
		this.ownerId = obj.owner_id;
		this.views = obj.views || 0;

		if (obj.tags === undefined) {
			throw new Error(
				`BooruPost should never be constructed without tags!`
			);
		}

		this.tags = obj.tags;
		this.numericScore = obj.numeric_score || 0;
	}

	/**
	 * A URL pointing to this post's content.
	 */
	get contentUrl() {
		return `${BaseUrl}/images/${this.hash}`;
	}

	/**
	 * A URL pointing to this post's thumbnail.
	 */
	get thumbUrl() {
		return `${BaseUrl}/thumbs/${this.hash}`;
	}

	/**
	 * The ratio between the width and height of this post's content.
	 */
	get aspectRatio() {
		return this.imageSize[0] / this.imageSize[1];
	}

	getImageSizeStyles(): React.CSSProperties {
		return {
			aspectRatio: this.aspectRatio
			//width: (this.imageSize[0] > this.imageSize[1] ? "auto" : "100%"),
			//height: (this.imageSize[0] > this.imageSize[1] ? "90vh" : "auto")
		};
	}
}

export { BooruPost };
export type { ShimmiePost };
