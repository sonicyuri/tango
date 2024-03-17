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
import { Result } from "../util/Functional";
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
}

/**
 * A value in a Redux store that might still be loading.
 */
export class AsyncValue<T> {
	private logger: Logger;
	private errorFactory: UIErrorFactory<AsyncValue<T>>;

	private value: StoredAsyncValue<T>;
	private actions: AsyncThunk<Result<T, UIError>, any, AsyncThunkConfig>[] =
		[];
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

	addReducers<StateType>(builder: ActionReducerMapBuilder<StateType>) {
		builder.addCase(this.stateUpdateAction, (state, action) => {
			this.setOnReduxState(state, { state: action.payload });
		});

		this.actions.forEach(action => {
			builder.addCase(action.fulfilled, (state, action) => {
				action.payload.match(
					val => {
						this.setOnReduxState(state, {
							value: val,
							state: AsyncValueState.Completed
						});
					},
					err => {
						this.setOnReduxState(state, {
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
				this.setOnReduxState(state, { state: AsyncValueState.Failed });
			});
		});
	}

	addAction<S>(
		name: string,
		callback: (payload: S) => Promise<Result<T, UIError>>
	) {
		const action = createAsyncThunk(name, (payload: S, thunkApi) => {
			thunkApi.dispatch(this.stateUpdateAction(AsyncValueState.Loading));

			return callback(payload)
				.then(value => {
					value.ifFailure(err => thunkApi.dispatch(uiError(err)));
					return value;
				})
				.catch(err => {
					return Result.failure<T, UIError>(
						this.errorFactory.castOrCreateUnknown(err)
					);
				});
		});

		this.actions.push(action);
		return action;
	}

	private setOnReduxState(state: any, newValues: any) {
		const currentStateObject: StoredAsyncValue<T> = (state as any)[
			this.name
		];
		const newStateObject = new StoredAsyncValue(
			currentStateObject.state,
			currentStateObject.value
		);
		Object.assign(newStateObject, newValues);
		(state as any)[this.name] = newStateObject;
	}
}
