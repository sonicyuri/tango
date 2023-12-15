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

	public getContentTypes(): string {
		const parts: string[] = [];
		if (this.showImages) {
			parts.push("image");
		}
		if (this.showVideo) {
			parts.push("video");
		}
		if (this.showVr) {
			parts.push("vr");
		}
		return parts.join(",");
	}

	public getMap(): { images: boolean; videos: boolean; vr: boolean } {
		return { images: this.showImages, videos: this.showVideo, vr: this.showVr };
	}

	private saveValues() {
		LocalSettings.searchFilterOptions.value = this;
	}
}
