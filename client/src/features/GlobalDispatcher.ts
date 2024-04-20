/** @format */

export type GlobalDispatchType = any;
export type GlobalDispatchCallback = (action: GlobalDispatchType) => void;

/**
 * Allows dispatching actions against the store without importing the store.
 */
export class GlobalDispatcher {
	private static dispatchCallback?: GlobalDispatchCallback;
	private static pendingDispatch: GlobalDispatchType[] = [];

	/**
	 * Sets the callback through which we can actually perform the dispatch.
	 * Should only be called once.
	 */
	static setDispatchCallback(callback: GlobalDispatchCallback) {
		this.dispatchCallback = callback;
		this.pendingDispatch.forEach(cb => callback(cb));
		this.pendingDispatch = [];
	}

	/**
	 * Dispatches an action.
	 */
	static dispatch(action: GlobalDispatchType) {
		if (this.dispatchCallback === undefined) {
			this.pendingDispatch.push(action);
			return;
		}

		this.dispatchCallback(action);
	}
}
