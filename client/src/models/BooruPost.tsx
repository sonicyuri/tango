/** @format */

import getTangoConfig from "../TangoConfig";

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
	tags: string[];
}

class BooruPost {
	// id of the image
	public id: string;
	// size in pixels, width x height
	public imageSize: [number, number];
	// hash of the image
	public hash: string;
	// size in bytes
	public fileSize: number;
	// file extension
	public extension: string;
	// mime type
	public mimeType: string;
	// date posted
	public postedAt: Date;
	// the source of the image
	public source: string | null;
	// the numeric score of this image
	public numericScore: number;
	// the ID of the owner
	public ownerId: string;
	// all the tags added to the image
	public tags: string[];

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
		this.tags = obj.tags;
		this.numericScore = obj.numeric_score || 0;
	}

	get videoUrl() {
		return `${BaseUrl}/images/${this.hash}`;
	}

	get thumbUrl() {
		return `${BaseUrl}/thumbs/${this.hash}`;
	}

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
