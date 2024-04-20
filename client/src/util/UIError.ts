/** @format */

import { notify } from "reapop";
import { ApiResponse } from "../features/ApiResponse";
import i18n from "./Internationalization";
import { LogFactory, Logger } from "./Logger";
import { Result } from "./Result";

export interface UIErrorFactoryOptions {
	errorObject?: any;
	context?: any;
}

type UIErrorResultType =
	| { type: "error"; message: string }
	| { type: "success"; result: any };

export class UIErrorFactory<T> {
	private name: string;
	private logger: Logger;
	private thisObj: T | undefined;

	constructor(name: string, thisObj: T | undefined = undefined) {
		this.name = name;
		this.logger = LogFactory.create(name);
		this.thisObj = thisObj;
	}

	create(
		msg: string,
		userMsg: string | undefined = undefined,
		options: UIErrorFactoryOptions = {}
	) {
		this.logError(msg, userMsg || msg, options);
		return UIError.create(this.formatMessage(msg), userMsg || msg);
	}

	localized(
		msgKey: string,
		userKey: string | undefined = undefined,
		options: UIErrorFactoryOptions = {}
	) {
		const msg = i18n.t(msgKey);
		const userMsg = userKey === undefined ? msg : i18n.t(userKey);
		this.logError(msg, userMsg, options);
		return UIError.create(this.formatMessage(msg), userMsg);
	}

	localizedUser(
		msg: string,
		userKey: string,
		options: UIErrorFactoryOptions = {}
	) {
		const formattedMessage = this.formatMessage(msg);
		const userMsg = i18n.t(userKey);
		this.logError(msg, userMsg, options);
		return UIError.create(formattedMessage, userMsg);
	}

	wrapError<ValueType, SuccessType>(
		promise: Promise<ApiResponse<ValueType>>,
		userKey: string,
		onSuccess: (val: ValueType) => Promise<Result<SuccessType, UIError>>
	) {
		return promise.then(response =>
			response.matchPromise(onSuccess, err =>
				err.toResultPromise<T, SuccessType>(this, i18n.t(userKey))
			)
		);
	}

	wrapErrorOnly<ValueType>(
		promise: Promise<ApiResponse<ValueType>>,
		userKey: string
	) {
		return this.wrapError(
			promise,
			userKey,
			Result.successPromise<ValueType, UIError>
		);
	}

	/**
	 * Casts an unknown error type to UIError if it's a UIError, or creates a new UIError and returns it.
	 */
	castOrCreateUnknown(err: any): UIError {
		if (UIError.isUIError(err)) {
			return err as UIError;
		}

		return this.create(`Unknown error: ${err}`, "Unknown error!", {
			errorObject: err
		});
	}

	private logError(
		msg: string,
		userMsg: string,
		options: UIErrorFactoryOptions
	) {
		let additionalData: Partial<UIErrorFactoryOptions> & {
			userMessage: string;
			thisObj?: T;
		} = { userMessage: userMsg };
		if (options.context !== undefined) {
			additionalData.context = options.context;
		}

		if (options.errorObject !== undefined) {
			additionalData.errorObject = options.errorObject;
		}

		if (this.thisObj !== undefined) {
			additionalData.thisObj = this.thisObj;
		}

		const formattedMessage = this.formatMessage(msg);
		this.logger.error(formattedMessage, additionalData);
	}

	private formatMessage(msg: string) {
		return `<UIError> ${msg}`;
	}
}

export class StaticUIErrorFactory extends UIErrorFactory<undefined> {
	constructor(name: string) {
		super(name);
	}
}

export class UIError {
	private msg: string;
	private userMsg: string;

	static create(msg: string, userMsg: string | undefined = undefined) {
		return new UIError(msg, userMsg || msg);
	}

	/**
	 * Checks if the given type is a UIError.
	 */
	static isUIError(err: any): boolean {
		return err && err.isUIError !== undefined && err.isUIErrorInternal();
	}

	get message(): string {
		return this.msg;
	}

	get userMessage(): string {
		return this.userMsg;
	}

	private constructor(msg: string, userMsg: string) {
		this.msg = msg;
		this.userMsg = userMsg;
	}

	private isUIErrorInternal(): boolean {
		return true;
	}
}

export function uiError(error: UIError) {
	return notify(error.userMessage, "error");
}
