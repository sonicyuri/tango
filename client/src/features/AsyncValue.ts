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

export enum AsyncValueState {
	Initial,
	Loading,
	Completed,
	Failed
}

export class StoredAsyncValue<T> {
	public state: AsyncValueState;
	public value: T;

	constructor(state: AsyncValueState, value: T) {
		this.state = state;
		this.value = value;
	}

	ready(): boolean {
		return this.state === AsyncValueState.Completed;
	}

	valueOrDefault(defaultValue: T) {
		if (this.ready()) {
			return this.value;
		}

		return defaultValue;
	}
}

type AsyncActionType<T, ReturnType> = {
	thunk: AsyncThunk<Result<ReturnType, UIError>, any, AsyncThunkConfig>;
	reducer: (self: T, state: any, val: ReturnType) => Result<T, UIError>;
};

/**
 * A value in a Redux store that might still be loading.
 */
export class AsyncValue<T> {
	private logger: Logger;
	private errorFactory: UIErrorFactory<AsyncValue<T>>;

	private value: StoredAsyncValue<T>;
	private asyncActions: AsyncActionType<T, any>[] = [];
	private actions: {
		name: string;
		callback: (state: T, payload: any) => Result<T, UIError>;
	}[] = [];
	private name: string;

	private stateUpdateAction: ActionCreatorWithPayload<AsyncValueState>;

	get storedValue(): StoredAsyncValue<T> {
		return this.value;
	}

	constructor(
		prefix: string,
		name: string,
		defaultValue: T,
		defaultState: AsyncValueState = AsyncValueState.Initial
	) {
		this.logger = LogFactory.create("AsyncValue<T>:" + name);
		this.errorFactory = new UIErrorFactory("AsyncValue<T>:" + name, this);

		this.name = name;
		this.value = new StoredAsyncValue<T>(defaultState, defaultValue);

		this.stateUpdateAction = createAction<AsyncValueState>(
			`${prefix}/${this.name}_AsyncValue_StateUpdate`
		);
	}

	setupReducers<StateType>(builder: ActionReducerMapBuilder<StateType>) {
		builder.addCase(this.stateUpdateAction, (state, action) => {
			this.setOnReduxState(state, { state: action.payload });
		});

		this.actions.forEach(({ name, callback }) => {
			builder.addCase<any, { type: string; payload: any }>(
				name,
				(state, action) => {
					const currentStoredValue: StoredAsyncValue<T> = (
						state as any
					)[this.name];
					callback(
						currentStoredValue.value,
						action.payload
					).ifSuccess(newValue => {
						this.setOnReduxState(state, { value: newValue });
					});
				}
			);
		});

		this.asyncActions.forEach(action => {
			builder.addCase(action.thunk.fulfilled, (state, { payload }) => {
				payload.match(
					val => {
						const thisValue = (state as any)[this.name].value as T;
						action.reducer(thisValue, state as any, val).match(
							val => {
								this.setOnReduxState(state, {
									state: AsyncValueState.Completed,
									value: val
								});
							},
							err => {
								this.setOnReduxState(state, {
									state: AsyncValueState.Failed
								});
							}
						);
					},
					err => {
						this.setOnReduxState(state, {
							state: AsyncValueState.Failed
						});
					}
				);
			});

			builder.addCase(action.thunk.rejected, (state, action) => {
				this.logger.error(
					`Action ${action.type} rejected unexpectedly`,
					action
				);
				this.setOnReduxState(state, { state: AsyncValueState.Failed });
			});
		});
	}

	addAction<S>(
		name: string,
		callback: (state: T, payload: S) => Result<T, UIError>
	) {
		this.actions.push({
			name,
			callback
		});

		return (payload: S) => ({ type: name, payload });
	}

	addAsyncAction<S, StateType, ReturnType>(
		name: string,
		callback: (payload: S) => Promise<Result<ReturnType, UIError>>,
		customReducer?: (
			self: T,
			state: StateType,
			result: ReturnType
		) => Result<T, UIError>
	) {
		const thunk = createAsyncThunk(name, (payload: S, thunkApi) => {
			thunkApi.dispatch(this.stateUpdateAction(AsyncValueState.Loading));

			return callback(payload)
				.then(value => {
					value.ifFailure(err => thunkApi.dispatch(uiError(err)));
					return value;
				})
				.catch(err => {
					return Result.failure<ReturnType, UIError>(
						this.errorFactory.castOrCreateUnknown(err)
					);
				});
		});

		const action: AsyncActionType<T, ReturnType> = {
			thunk,
			reducer:
				customReducer ??
				((self, state, val) => Result.success(val as any as T))
		};

		this.asyncActions.push(action);

		return thunk;
	}

	/**
	 * Returns a copy of the given state object with this value's properties decomposed into individual fields.
	 */
	decomposeProperties<T extends object, StateType>(
		state: StateType
	): StateType & {
		[Property in keyof T]: StoredAsyncValue<T[Property]>;
	} {
		const currentStoredValue: StoredAsyncValue<T> = (state as any)[
			this.name
		];
		const currentStoredObj = currentStoredValue.value as any;

		let newState: any = {};
		newState = Object.assign(newState, state);
		Object.keys(currentStoredObj).forEach(k => {
			newState[k] = new StoredAsyncValue<object>(
				currentStoredValue.state,
				currentStoredObj[k]
			);
		});

		return newState as any;
	}

	private setOnReduxState(state: any, newValues: any) {
		const currentStateObject: StoredAsyncValue<T> = (state as any)[
			this.name
		];
		let newStateObject: any = new StoredAsyncValue(
			currentStateObject.state,
			currentStateObject.value
		);
		newStateObject = Object.assign(newStateObject, newValues);
		(state as any)[this.name] = newStateObject;
	}
}
