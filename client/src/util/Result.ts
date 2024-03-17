/** @format */

import { LogFactory, LoggedError, Logger } from "./Logger";

const logger: Logger = LogFactory.create("Functional");

export type ResultContents<ValueType, ErrorType> =
	| { type: "value"; value: ValueType }
	| { type: "error"; error: ErrorType | undefined };

/**
 * Represents a return value that's either a result or an error.
 */
export class Result<ValueType, ErrorType> {
	protected contents: ResultContents<ValueType, ErrorType>;

	/**
	 * Creates a new result containing a value.
	 */
	static success<ValueType, ErrorType>(val: ValueType) {
		return new Result<ValueType, ErrorType>({ type: "value", value: val });
	}

	/**
	 * Creates a new result containing an error.
	 */
	static failure<ValueType, ErrorType>(err: ErrorType) {
		return new Result<ValueType, ErrorType>({ type: "error", error: err });
	}

	/**
	 * Creates a new promise resolving in a result containing a value.
	 */
	static successPromise<ValueType, ErrorType>(val: ValueType) {
		return Promise.resolve(Result.success<ValueType, ErrorType>(val));
	}

	protected constructor(contents: ResultContents<ValueType, ErrorType>) {
		this.contents = contents;
	}

	protected setError(err: ErrorType) {
		this.contents = { type: "error", error: err };
	}

	/**
	 * Check if this result contains a value.
	 * @returns True if this result contains a value, false if it contains an error.
	 */
	get success(): boolean {
		return this.contents.type === "value";
	}

	/**
	 * Calls one of the two provided functions, depending on the state of this result.
	 * @param onSuccess If this result contains a value, this method will be called with the value.
	 * @param onFailure If this result contains an error, this method will be called with the error.
	 */
	match(
		onSuccess: (val: ValueType) => void,
		onFailure: (err: ErrorType) => void
	) {
		if (this.contents.type === "value") {
			onSuccess(this.contents.value);
		} else if (this.contents.error !== undefined) {
			onFailure(this.contents.error);
		}
	}

	/**
	 * Picks which promise to return based on the contents of the result.
	 */
	matchPromise<ReturnType>(
		successPromise: (val: ValueType) => Promise<ReturnType>,
		failurePromise: (err: ErrorType) => Promise<ReturnType>
	): Promise<ReturnType> {
		if (this.contents.type === "error") {
			if (this.contents.error === undefined) {
				throw new LoggedError(
					logger,
					"Result should never have an undefined error!"
				);
			}

			return failurePromise(this.contents.error);
		}

		return successPromise(this.contents.value);
	}

	/**
	 * Creates a new promise that resolves if the result contains a value or rejects if it contains an error.
	 */
	promise(): Promise<ValueType> {
		if (this.contents.type === "value") {
			return Promise.resolve(this.contents.value);
		}

		return Promise.reject(this.contents.error);
	}

	/**
	 * Runs the specified function if the result contains a value.
	 */
	ifSuccess(func: (val: ValueType) => any) {
		if (this.contents.type == "value") {
			func(this.contents.value);
		}
	}

	/**
	 * Runs the specified function if the result contains an error.
	 */
	ifFailure(func: (val: ErrorType) => any) {
		if (
			this.contents.type === "error" &&
			this.contents.error !== undefined
		) {
			func(this.contents.error);
		}
	}

	/**
	 * Casts this result to a new result of a different type, replacing the value
	 * with the result of func if the result contains a value.
	 */
	map<CastType>(
		func: (val: ValueType) => CastType
	): Result<CastType, ErrorType> {
		if (this.contents.type === "value") {
			return new Result<CastType, ErrorType>({
				type: "value",
				value: func(this.contents.value)
			});
		}

		return new Result<CastType, ErrorType>({
			type: "error",
			error: this.contents.error
		});
	}
}
