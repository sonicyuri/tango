/** @format */

import { Logger, pino } from "pino";
import nconf from "nconf";
import { ApiResponse } from "./ApiAsyncHandler";

class Util {
	static getLogger(name: string): Logger<{}> {
		return pino({
			name: name
		});
	}

	static formatApiResponse(response: ApiResponse): string {
		return JSON.stringify(response);
	}

	static exclude<T, Key extends keyof T>(user: T, keys: Key[]): Omit<T, Key> {
		const keysStr = keys.map(k => k.toString());
		return Object.fromEntries(Object.entries(user as any).filter(([key]) => !keysStr.includes(key))) as Omit<
			T,
			Key
		>;
	}

	/**
	 * Turns a php password_hash $2y$ bcrypt hash into a regular $2a$ hash
	 * @param hash
	 */
	static fixBcryptHash(hash: string): string {
		return hash.replace(/^\$2y/, "$2a");
	}
}

export default Util;
