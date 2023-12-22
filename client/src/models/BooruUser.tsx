/** @format */
export type ShimmieClass = "base" | "ghost" | "anonymous" | "user" | "hellbanned" | "admin";

export interface ShimmieUser {
	id: string;
	name: string;
	joindate: string;
	class: string;
	uploadcount: number;
	commentcount: string;
}

class BooruUser {
	public id: string;
	public username: string;
	public class: ShimmieClass;
	public uploadCount: number;
	public commentCount: number;

	private joindate: string;

	public get joinedAt(): Date {
		return new Date(this.joindate);
	}

	constructor(obj: ShimmieUser) {
		this.id = obj.id;
		this.username = obj.name;
		this.joindate = obj.joindate;
		this.class = obj.class as ShimmieClass;
		this.uploadCount = obj.uploadcount;
		this.commentCount = parseInt(obj.commentcount, 10);
	}
}

export { BooruUser as User };
