/** @format */

import { configureStore } from "@reduxjs/toolkit";
import { reducer as notificationsReducer } from "reapop";
import authReducer from "./auth/AuthSlice";
import favoriteReducer from "./favorites/FavoriteSlice";
import importReducer from "./import/ImportSlice";
import inviteReducer from "./invites/InviteSlice";
import postReducer from "./posts/PostSlice";
import tagAliasReducer from "./tags/TagAliasSlice";
import tagReducer from "./tags/TagSlice";
import userConfigReducer from "./user_config/UserConfigSlice";

export const Store = configureStore({
	reducer: {
		notifications: notificationsReducer(),
		auth: authReducer,
		post: postReducer,
		tag: tagReducer,
		favorite: favoriteReducer,
		tag_alias: tagAliasReducer,
		import: importReducer,
		user_config: userConfigReducer,
		invite: inviteReducer
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: false
		})
});

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;
