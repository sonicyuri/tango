/** @format */
import { createSlice, Reducer } from "@reduxjs/toolkit";

import { LogFactory, Logger } from "../../util/Logger";
import { StaticUIErrorFactory } from "../../util/UIError";
import { AsyncValue, StoredAsyncValue } from "../AsyncValue";
import { RootState } from "../Store";
import FavoriteService from "./FavoriteService";

const logger: Logger = LogFactory.create("FavoriteSlice");
const errorFactory: StaticUIErrorFactory = new StaticUIErrorFactory(
	"FavoriteSlice"
);

type FavoriteLoadingState = "initial" | "loading" | "ready";

const favoritesValue = new AsyncValue<string[]>("favorite", "favorites", []);

interface FavoriteState {
	favorites: StoredAsyncValue<string[]>;
}

export const favoriteList = favoritesValue.addAsyncAction(
	"favorite/list",
	(_: null) =>
		errorFactory.wrapErrorOnly(
			FavoriteService.getFavorites(),
			"modules.favorites.errors.list"
		)
);

export const favoriteSet = favoritesValue.addAsyncAction(
	"favorite/set",
	(request: { postId: string; favorite: boolean }) =>
		errorFactory.wrapErrorOnly(
			FavoriteService.setFavorite(request.postId, request.favorite),
			"modules.favorites.errors.set"
		)
);

const initialState: FavoriteState = {
	favorites: favoritesValue.storedValue
};

export const FavoriteSlice = createSlice({
	name: "favorite",
	initialState,
	reducers: {},
	extraReducers: builder => {
		favoritesValue.setupReducers(builder);
	}
});

export default FavoriteSlice.reducer as Reducer<FavoriteState>;
export const selectFavoriteState = (state: RootState) => state.favorite;
