/** @format */

interface ShimmieTagCategory {
	color: string;
	display_singular: string;
	display_multiple: string;
	category: string;
}

class BooruTag {
	public tag: string;
	public frequency: number;

	constructor(tag: string, frequency: number) {
		this.tag = tag;
		this.frequency = frequency;
	}

	static getCategory(tag: string, categories: BooruTagCategory[]): BooruTagCategory | null {
		const parts = tag.split(":");
		if (parts.length == 1) {
			return null;
		}

		return categories.find(c => c.id == parts[0]) || null;
	}
}

class BooruTagCategory {
	public color: string;
	public id: string;
	public displaySingular: string;
	public displayMultiple: string;

	constructor(cat: ShimmieTagCategory) {
		this.color = cat.color;
		this.id = cat.category;
		this.displaySingular = cat.display_singular;
		this.displayMultiple = cat.display_multiple;
	}
}

export type { ShimmieTagCategory };
export { BooruTag, BooruTagCategory };
