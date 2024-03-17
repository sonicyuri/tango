/** @format */

import {
	Action,
	ActionCreatorWithPayload,
	ActionReducerMapBuilder,
	AsyncThunk,
	CaseReducer,
	createAction,
	createAsyncThunk
} from "@reduxjs/toolkit";
import { LogFactory, Logger } from "../util/Logger";
import { AsyncThunkConfig } from "@reduxjs/toolkit/dist/createAsyncThunk";
import { Result } from "../util/Result";
import { UIError, UIErrorFactory, uiError } from "../util/UIError";
import { ApiResponse, ApiResponseError } from "./ApiResponse";
import { AsyncValue, StoredAsyncValue } from "./AsyncValue";

export enum AsyncValueState {
	Initial,
	Loading,
	Completed,
	Failed
}

export type StoredAsyncMapValue<ValueType> = {
	[key: string]: StoredAsyncValue<ValueType>;
};

/**
 * A value in a Redux store that might still be loading.
 */
export class AsyncMapValue<T> {
	private logger: Logger;
	private errorFactory: UIErrorFactory<AsyncMapValue<T>>;

	private value: StoredAsyncMapValue<T>;
	private asyncActions: AsyncThunk<
		{ key: string; result: Result<T, UIError> },
		any,
		AsyncThunkConfig
	>[] = [];
	private actions: {
		name: string;
		callback: (state: T, payload: any) => Result<T, UIError>;
	}[] = [];
	private name: string;

	private stateUpdateAction: ActionCreatorWithPayload<{
		key: string;
		state: AsyncValueState;
	}>;

	get storedValue(): StoredAsyncMapValue<T> {
		return this.value;
	}

	constructor(
		prefix: string,
		name: string,
		defaultState: AsyncValueState = AsyncValueState.Initial
	) {
		this.logger = LogFactory.create("AsyncMapValue<T>:" + name);
		this.errorFactory = new UIErrorFactory(
			"AsyncMapValue<T>:" + name,
			this
		);

		this.name = name;
		this.value = {};

		this.stateUpdateAction = createAction<{
			key: string;
			state: AsyncValueState;
		}>(`${prefix}/${this.name}_AsyncMapValue_StateUpdate`);
	}

	setupReducers<StateType>(builder: ActionReducerMapBuilder<StateType>) {
		builder.addCase(this.stateUpdateAction, (state, action) => {
			this.setOnReduxState(state, action.payload.key, {
				state: action.payload.state
			});
		});

		this.actions.forEach(({ name, callback }) => {
			builder.addCase<
				any,
				{ type: string; payload: { key: string; payload: any } }
			>(name, (state, action) => {
				const currentStoredValue: StoredAsyncValue<T> = (state as any)[
					this.name
				][action.payload.key];
				callback(
					currentStoredValue.value,
					action.payload.payload
				).ifSuccess(newValue => {
					this.setOnReduxState(state, action.payload.key, newValue);
				});
			});
		});

		this.asyncActions.forEach(action => {
			builder.addCase(action.fulfilled, (state, action) => {
				const { key, result } = action.payload;

				result.match(
					val => {
						this.setOnReduxState(state, key, {
							value: val,
							state: AsyncValueState.Completed
						});
					},
					err => {
						this.setOnReduxState(state, key, {
							state: AsyncValueState.Failed
						});
					}
				);
			});

			builder.addCase(action.rejected, (state, action) => {
				this.logger.error(
					`Action ${action.type} rejected unexpectedly`,
					action
				);
				if (
					action.payload !== undefined &&
					(action.payload as any).key !== undefined
				) {
					this.setOnReduxState(state, (action.payload as any).key, {
						state: AsyncValueState.Failed
					});
				}
			});
		});
	}

	addAction<S>(
		name: string,
		getKey: (payload: S) => string,
		callback: (state: T, payload: S) => Result<T, UIError>
	) {
		this.actions.push({
			name,
			callback
		});

		return (payload: S) => ({
			type: name,
			payload: { key: getKey(payload), payload }
		});
	}

	addAsyncAction<S>(
		name: string,
		getKey: (payload: S) => string,
		callback: (payload: S) => Promise<Result<T, UIError>>
	) {
		const action = createAsyncThunk(name, (payload: S, thunkApi) => {
			const key = getKey(payload);
			thunkApi.dispatch(
				this.stateUpdateAction({ key, state: AsyncValueState.Loading })
			);

			return callback(payload)
				.then(value => {
					value.ifFailure(err => thunkApi.dispatch(uiError(err)));
					return { key, result: value };
				})
				.catch(err => {
					return {
						key,
						result: Result.failure<T, UIError>(
							this.errorFactory.castOrCreateUnknown(err)
						)
					};
				});
		});

		this.asyncActions.push(action);
		return action;
	}

	private setOnReduxState(state: any, key: string, newValues: any) {
		const currentStateObject: StoredAsyncMapValue<T> = (state as any)[
			this.name
		];
		currentStateObject[key] = newValues;
		(state as any)[this.name] = { ...currentStateObject };
	}
}
