/** @format */

import { SearchFilterOptions } from "../features/SearchFilterOptions";

class Setting<Type> {
	private id: string;

	public get value(): Type | null {
		const val: string | null = localStorage.getItem(this.id);
		return val !== null ? JSON.parse(val) : val;
	}

	public set value(val: Type | null) {
		if (val === null) {
			localStorage.removeItem(this.id);
		} else {
			localStorage.setItem(this.id, JSON.stringify(val));
		}
	}

	public clear(): void {
		localStorage.removeItem(this.id);
	}

	constructor(id: string) {
		this.id = id;
	}

	protected typeToStr(val: Type): string {
		return JSON.stringify(val);
	}

	protected strToType(val: string): Type {
		return JSON.parse(val);
	}
}

class SettingWithDefault<Type> extends Setting<Type> {
	private defaultValue: Type;

	public get value(): Type {
		return super.value || this.defaultValue;
	}

	constructor(id: string, defaultValue: Type) {
		super(id);
		this.defaultValue = defaultValue;
	}
}

class LocalSettings {
	public static username: Setting<string> = new Setting<string>(
		"auth:username"
	);
	public static accessToken: Setting<string> = new Setting<string>(
		"token:access"
	);
	public static accessTokenExpire: Setting<string> = new Setting<string>(
		"token:access:expire"
	);
	public static refreshToken: Setting<string> = new Setting<string>(
		"token:refresh"
	);
	public static refreshTokenExpire: Setting<string> = new Setting<string>(
		"token:refresh:expire"
	);
	public static searchFilterOptions: Setting<SearchFilterOptions> =
		new Setting<SearchFilterOptions>("settings:search_filter");
	// todo: set default based on server setting
	public static pageSize: SettingWithDefault<number> =
		new SettingWithDefault<number>("setting:page_size", 48);
}

export { LocalSettings, Setting };
