/** @format */

import {
	ActionCreatorWithPayload,
	ActionReducerMapBuilder,
	AsyncThunk,
	createAction,
	createAsyncThunk
} from "@reduxjs/toolkit";
import { AsyncThunkConfig } from "@reduxjs/toolkit/dist/createAsyncThunk";
import { notify } from "reapop";
import { LogFactory, Logger } from "../util/Logger";
import { Result } from "../util/Result";
import { UIError, UIErrorFactory, uiError } from "../util/UIError";
import { GlobalDispatcher } from "./GlobalDispatcher";

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

export type AsyncValueChangeCallback<T> = (val: StoredAsyncValue<T>) => void;

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

	private onStateChange: AsyncValueChangeCallback<T>[] = [];
	private onValueChange: AsyncValueChangeCallback<T>[] = [];

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

	/**
	 * Sets up the necessary reducers for the actions added to this AsyncValue.
	 */
	setupReducers<StateType>(builder: ActionReducerMapBuilder<StateType>) {
		builder.addCase(this.stateUpdateAction, (state, action) => {
			this.setOnReduxState(state, { state: action.payload });
		});

		// configure the non-async actions
		// these don't update the loading state the way
		this.actions.forEach(({ name, callback }) => {
			builder.addCase<any, { type: string; payload: any }>(
				name,
				(state, action) => {
					const currentStoredValue: StoredAsyncValue<T> = (
						state as any
					)[this.name];

					callback(currentStoredValue.value, action.payload).match(
						newValue => {
							this.setOnReduxState(state, { value: newValue });
						},
						err => {
							GlobalDispatcher.dispatch(
								notify(err.userMessage, "error")
							);
						}
					);
				}
			);
		});

		// add the async actions
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
								GlobalDispatcher.dispatch(
									notify(err.userMessage, "error")
								);
								this.setOnReduxState(state, {
									state: AsyncValueState.Failed
								});
							}
						);
					},
					err => {
						GlobalDispatcher.dispatch(
							notify(err.userMessage, "error")
						);
						this.setOnReduxState(state, {
							state: AsyncValueState.Failed
						});
					}
				);
			});

			// in any expected case, the reducers should return results with errors, not reject
			// if they do it's an unexpected error
			builder.addCase(action.thunk.rejected, (state, action) => {
				this.logger.error(
					`Action ${action.type} rejected unexpectedly`,
					action
				);
				this.setOnReduxState(state, { state: AsyncValueState.Failed });
			});
		});
	}

	/**
	 * Adds a synchronous Redux action that modifies this value.
	 * @param name The name of the new action.
	 * @param callback The callback to run when the action is performed. The result of this callback will update the AsyncValue.
	 */
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

	/**
	 * Adds an asynchronous Redux action that modifies this value.
	 * @param name The name of the new action.
	 * @param callback The callback to run when this action is performed. The result of this callback will update the AsyncValue.
	 * @param customReducer If specified, this method will be run after the callback is complete and can modify the store.
	 */
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
	 * Adds a callback that runs when this AsyncValue's state is changed.
	 */
	addStateChangeListener(callback: AsyncValueChangeCallback<T>) {
		this.onStateChange.push(callback);
	}

	/**
	 * Adds a callback that runs when this AsyncValue's value is changed.
	 */
	addValueChangeListener(callback: AsyncValueChangeCallback<T>) {
		this.onValueChange.push(callback);
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

	private setOnReduxState(
		state: any,
		newValues: Partial<StoredAsyncValue<T>>
	) {
		const currentStateObject: StoredAsyncValue<T> = (state as any)[
			this.name
		];
		let newStateObject: any = new StoredAsyncValue(
			currentStateObject.state,
			currentStateObject.value
		);
		newStateObject = Object.assign(newStateObject, newValues);
		(state as any)[this.name] = newStateObject;

		if (newValues.state !== undefined) {
			this.onStateChange.forEach(cb => cb(newStateObject));
		}
		if (newValues.value !== undefined) {
			this.onValueChange.forEach(cb => cb(newStateObject));
		}
	}
}
