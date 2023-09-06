/** @format */

import { User } from ".prisma/client";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import moment from "moment";
import { Config } from "../../Config";
import Util from "../../util/Util";

const logger = Util.getLogger("modules/users/AuthUtil");

export interface TokenPayloadContents {
	id?: number;
	name?: string;
	type?: "access" | "refresh";
}

export default class AuthUtil {
	public static decodeBasicHeader(header: string): { username: string; password: string } {
		const headerParts = header.split(" ");
		if (headerParts.length < 2 || headerParts[0] != "Basic") {
			return { username: "", password: "" };
		}

		const decodedStr = Buffer.from(headerParts[1], "base64").toString();
		const decodedParts = decodedStr.split(":");
		if (decodedParts.length < 2) {
			return { username: "", password: "" };
		}

		return { username: decodedParts[0], password: decodedParts[1] };
	}

	public static generateAuthToken(
		config: Config,
		user: User,
		type: "access" | "refresh"
	): { token: string; expires: string } {
		const expiration = type == "access" ? 60 * 60 * 24 : 60 * 60 * 24 * 30;
		const token = jwt.sign(
			{ name: user.name, id: user.id, type } as TokenPayloadContents,
			config.server?.token_secret ?? "",
			{
				expiresIn: expiration,
				algorithm: "HS256"
			}
		);
		return {
			token,
			expires: moment().add(expiration, "seconds").toISOString()
		};
	}

	public static verifyAuthToken(config: Config, token: string): TokenPayloadContents {
		try {
			return jwt.verify(token, config.server?.token_secret ?? "", {
				algorithms: ["HS256"]
			}) as TokenPayloadContents;
		} catch (err: any) {
			logger.error(err);
			return {};
		}
	}
}
