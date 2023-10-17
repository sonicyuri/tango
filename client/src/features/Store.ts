/** @format */

import { configureStore } from "@reduxjs/toolkit";
import { reducer as notificationsReducer } from "reapop";
import authReducer from "./auth/AuthSlice";
import postReducer from "./posts/PostSlice";
import tagReducer from "./tags/TagSlice";
import tagAliasReducer from "./tags/TagAliasSlice";
import favoriteReducer from "./favorites/FavoriteSlice";
import importReducer from "./import/ImportSlice";

export const Store = configureStore({
	reducer: {
		notifications: notificationsReducer(),
		auth: authReducer,
		post: postReducer,
		tag: tagReducer,
		favorite: favoriteReducer,
		tag_alias: tagAliasReducer,
		import: importReducer
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: false
		})
});

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;
