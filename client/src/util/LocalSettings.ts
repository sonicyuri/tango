/** @format */

class Setting<Type> {
	private id: string;

	public get value(): Type | null 
	{
		const val: string | null = localStorage.getItem(this.id);
		return val !== null ? JSON.parse(val) : val;
	}

	public set value(val: Type | null) 
	{
		if (val === null) 
		{
			localStorage.removeItem(this.id);
		} 
		else 
		{
			localStorage.setItem(this.id, JSON.stringify(val));
		}
	}

	public clear(): void 
	{
		localStorage.removeItem(this.id);
	}

	constructor(id: string) 
	{
		this.id = id;
	}

	protected typeToStr(val: Type): string 
	{
		return JSON.stringify(val);
	}

	protected strToType(val: string): Type 
	{
		return JSON.parse(val);
	}
}

class LocalSettings {
	public static username: Setting<string> = new Setting<string>("auth:username");
	public static password: Setting<string> = new Setting<string>("auth:password");
}

export { Setting, LocalSettings };
