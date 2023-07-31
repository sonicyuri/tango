/** @format */

import { configureStore } from "@reduxjs/toolkit";
import { reducer as notificationsReducer } from "reapop";
import authReducer from "./auth/AuthSlice";
import imageReducer from "./images/ImageSlice";
import tagReducer from "./tags/TagSlice";

export const Store = configureStore({
	reducer: {
		notifications: notificationsReducer(),
		auth: authReducer,
		image: imageReducer,
		tag: tagReducer
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: false
		})
});

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;
