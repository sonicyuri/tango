/** @format */

import { LocalSettings } from "../util/LocalSettings";

export class SearchFilterOptions {
	private _showVideo: boolean = true;
	private _showImages: boolean = false;
	private _showVr: boolean = false;

	private static _instance: SearchFilterOptions | null = null;

	public static get instance(): SearchFilterOptions {
		return (SearchFilterOptions._instance =
			SearchFilterOptions._instance ||
			Object.assign(new SearchFilterOptions(), LocalSettings.searchFilterOptions.value));
	}

	public get showVideo(): boolean {
		return this._showVideo;
	}
	public set showVideo(val: boolean) {
		this._showVideo = val;
		this.saveValues();
	}
	public get showImages(): boolean {
		return this._showImages;
	}
	public set showImages(val: boolean) {
		this._showImages = val;
		this.saveValues();
	}
	public get showVr(): boolean {
		return this._showVr;
	}
	public set showVr(val: boolean) {
		this._showVr = val;
		this.saveValues();
	}

	public createQuery(baseQuery: string): string {
		const baseQueryParts = baseQuery.split(" ");
		const baseQueryTags: { [key: string]: boolean } = {};
		baseQueryParts.forEach(t => {
			const realTag = t.startsWith("-") ? t.substr(1) : t;
			baseQueryTags[realTag] = !t.startsWith("-");
		});

		const shouldShowVideo =
			baseQueryTags["content=video"] === undefined ? this._showVideo : baseQueryTags["content=video"];
		const shouldShowImages =
			baseQueryTags["content=image"] === undefined ? this._showImages : baseQueryTags["content=image"];
		const shouldShowVr = baseQueryTags["vr"] === undefined ? this._showVr : baseQueryTags["vr"];

		let parts: string[] = [];

		if (!shouldShowVideo) {
			parts.push(shouldShowVr ? "vr" : "-content=video");
		}

		if (!shouldShowImages) {
			parts.push("-content=image");
		}

		if (!shouldShowVr) {
			parts.push("-vr");
		}

		return parts.join(" ");
	}

	private saveValues() {
		LocalSettings.searchFilterOptions.value = this;
	}
}
