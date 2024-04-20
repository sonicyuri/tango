/** @format */

import i18n from "../util/Internationalization";
import { Result, ResultContents } from "../util/Result";
import {
	UIError,
	UIErrorFactory,
	UIErrorFactoryOptions
} from "../util/UIError";

export type RawApiResponse<T> =
	| { type: "success"; result: T }
	| { type: "error"; message: string };

export enum HandleableErrorType {
	Unhandleable,

	CredentialsFailed
}

export class ApiResponseError {
	private errorMessage: string;
	private userMessage?: string;
	private endpoint: string;
	private parameters?: any;
	private context?: any;

	constructor(
		message: string,
		userMessage: string | undefined,
		endpoint: string,
		parameters?: any,
		context?: any
	) {
		this.errorMessage = message;
		this.userMessage = userMessage;

		this.endpoint = endpoint;
		this.parameters = parameters;
		this.context = context;
	}

	toUIError<UIErrorFactoryType>(
		factory: UIErrorFactory<UIErrorFactoryType>,
		userMessage?: string,
		options: UIErrorFactoryOptions = {}
	) {
		let additionalData: any = options.context || {};
		if (this.parameters !== undefined) {
			additionalData.parameters = this.parameters;
		}
		if (this.context !== undefined) {
			additionalData.context = this.context;
		}
		return factory.create(
			`API endpoint ${this.endpoint} returned error '${this.errorMessage}'`,
			this.userMessage ?? userMessage,
			{ ...options, context: additionalData }
		);
	}

	toResult<UIErrorFactoryType, SuccessType>(
		factory: UIErrorFactory<UIErrorFactoryType>,
		userMessage?: string,
		options: UIErrorFactoryOptions = {}
	) {
		return Result.failure<SuccessType, UIError>(
			this.toUIError(factory, userMessage, options)
		);
	}

	toResultPromise<UIErrorFactoryType, SuccessType>(
		factory: UIErrorFactory<UIErrorFactoryType>,
		userMessage?: string,
		options: UIErrorFactoryOptions = {}
	) {
		return Promise.resolve(
			this.toResult<UIErrorFactoryType, SuccessType>(
				factory,
				userMessage,
				options
			)
		);
	}
}

/**
 * Wraps a response from the Tango API.
 */
export class ApiResponse<T> extends Result<T, ApiResponseError> {
	/**
	 * Creates an API response from a raw response and metadata.
	 */
	static fromRaw<T>(
		rawResponse: RawApiResponse<T>,
		endpoint: string,
		parameters?: any,
		context?: any
	) {
		if (rawResponse.type === "success") {
			return new ApiResponse<T>({
				type: "value",
				value: rawResponse.result
			});
		}

		return new ApiResponse<T>({
			type: "error",
			error: new ApiResponseError(
				rawResponse.message,
				undefined,
				endpoint,
				parameters,
				context
			)
		});
	}

	/**
	 * Is this a handleable error?
	 */
	get handleable(): boolean {
		return false;
	}

	/**
	 * The type of this handleable error, if any.
	 */
	get handleableType(): HandleableErrorType {
		return HandleableErrorType.Unhandleable;
	}

	override map<CastType>(func: (val: T) => CastType): ApiResponse<CastType> {
		if (this.contents.type === "value") {
			return new ApiResponse<CastType>({
				type: "value",
				value: func(this.contents.value)
			});
		}

		return new ApiResponse<CastType>({
			type: "error",
			error: this.contents.error
		});
	}

	protected constructor(contents: ResultContents<T, ApiResponseError>) {
		super(contents);
	}
}

/**
 * An error response from an API that's handleable.
 * TODO: actual handle these responses
 */
export class HandleableErrorResponse<T> extends ApiResponse<T> {
	private type: HandleableErrorType;

	constructor(type: HandleableErrorType, error: ApiResponseError) {
		super({ type: "error", error });

		this.type = type;
	}

	override get handleable(): boolean {
		return true;
	}

	override get handleableType(): HandleableErrorType {
		return this.type;
	}
}

/**
 * An error from the API that credentials have been rejected.
 */
export class CredentialsFailedErrorResponse<
	T
> extends HandleableErrorResponse<T> {
	constructor(endpoint: string, parameters?: any, context?: any) {
		super(
			HandleableErrorType.CredentialsFailed,
			new ApiResponseError(
				"Credentials rejected!",
				i18n.t("modules.auth.errors.credentials_failed"),
				endpoint,
				parameters,
				context
			)
		);
	}
}
