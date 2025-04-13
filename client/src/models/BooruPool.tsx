/** @format */

import { BooruPost } from "./BooruPost";

export interface ShimmiePool {
	id: number;
	owner_id: number;
	public: boolean;
	title: string;
	description: string;
	date: string;
	posts: BooruPost[];
	cover: string;
}

export class BooruPool {
	public id: string;
	public title: string;
	public description: string;
	public public: boolean;
	public posts: BooruPost[];
	public cover_hash: string;

	private date: string;

	public get createdAt(): Date {
		return new Date(this.date);
	}

	constructor(obj: ShimmiePool) {
		this.id = String(obj.id);
		this.title = obj.title;
		this.description = obj.description;
		this.public = obj.public;
		this.date = obj.date;
		this.posts = obj.posts;
		this.cover_hash = obj.cover;
	}
}
