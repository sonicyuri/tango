/** @format */

interface ShimmiePost {
	id: string;
	width: number;
	height: number;
	hash: string;
	filesize: number;
	ext: string;
	posted: number;
	source: string | null;
	owner_id: string;
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
	// date posted
	public postedAt: Date;
	// the source of the image
	public source: string | null;
	// the ID of the owner
	public ownerId: string;
	// all the tags added to the image
	public tags: string[];

	constructor(obj: ShimmiePost) {
		this.id = obj.id;
		this.imageSize = [obj.width, obj.height];
		this.hash = obj.hash;
		this.fileSize = obj.filesize;
		this.extension = obj.ext;
		this.postedAt = new Date(obj.posted * 1000);
		this.source = obj.source;
		this.ownerId = obj.owner_id;
		this.tags = obj.tags;
	}

	get videoUrl() {
		return `https://s3.wasabisys.com/booru/images/${this.hash}`;
	}

	get thumbUrl() {
		return `https://s3.wasabisys.com/booru/thumbs/${this.hash}`;
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
