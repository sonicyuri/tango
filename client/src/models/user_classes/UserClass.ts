/** @format */

import Permissions from "./Permissions";

const GlobalUserClasses: { [name: string]: UserClass } = {};

export class UserClass {
	private permissions: Partial<Permissions>;
	private name: string;
	private parent: string | null;

	private get parentClass(): UserClass | null {
		return this.parent ? GlobalUserClasses[this.parent] : null;
	}

	constructor(name: string, parent: string | null, permissions: Partial<Permissions> | (keyof Permissions)[]) {
		this.name = name;
		this.parent = parent;
		if (permissions instanceof Array) {
			this.permissions = {};
			(permissions as (keyof Permissions)[]).forEach(k => {
				this.permissions[k] = true;
			});
		} else {
			this.permissions = permissions as Partial<Permissions>;
		}

		GlobalUserClasses[name] = this;
	}

	public can(ability: keyof Permissions): boolean {
		const thisPermission = this.permissions[ability];
		if (thisPermission !== undefined) {
			return thisPermission;
		}

		if (this.parent != null) {
			return this.parentClass?.can(ability) ?? false;
		}

		throw new Error("unknown ability " + ability);
	}

	public static canClass(userClass: string, ability: keyof Permissions): boolean {
		if (GlobalUserClasses[userClass] === undefined) {
			return false;
		}

		return GlobalUserClasses[userClass].can(ability);
	}
}
