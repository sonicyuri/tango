/** @format */

export interface ShimmiePool {
	id: number;
	public: boolean;
	title: string;
	description: string;
	date: string;
	post_count: number;
}

export class BooruPool {
	public id: string;
	public title: string;
	public description: string;
	public post_count: number;
	public public: boolean;

	private date: string;

	public get createdAt(): Date {
		return new Date(this.date);
	}

	constructor(obj: ShimmiePool) {
		this.id = String(obj.id);
		this.title = obj.title;
		this.description = obj.description;
		this.post_count = obj.post_count;
		this.public = obj.public;
		this.date = obj.date;
	}
}
