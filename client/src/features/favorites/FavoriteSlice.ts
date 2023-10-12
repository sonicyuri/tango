/** @format */
import { CaseReducer, createAsyncThunk, createSlice, PayloadAction, Reducer } from "@reduxjs/toolkit";
import { notify } from "reapop";

import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import FavoriteService from "./FavoriteService";

const logger: Logger = LogFactory.create("FavoriteSlice");

type FavoriteLoadingState = "initial" | "loading" | "ready";

interface FavoriteState {
	favorites: string[];
	loadingState: FavoriteLoadingState;
}

const setLoadingState: CaseReducer<FavoriteState, PayloadAction<FavoriteLoadingState>> = (state, action) => {
	state.loadingState = action.payload;
};

const setLoadingStateAction = (newState: FavoriteLoadingState): PayloadAction<FavoriteLoadingState> => ({
	type: "favorite/setLoadingState",
	payload: newState
});

export const favoriteList = createAsyncThunk("favorite/list", async (_: null, thunkApi) => {
	try {
		thunkApi.dispatch(setLoadingStateAction("loading"));

		const res = await FavoriteService.getFavorites();
		if (res.type == "success") {
			return { favorites: res.result };
		} else {
			thunkApi.dispatch(notify(res.message, "error"));
			return thunkApi.rejectWithValue({});
		}
	} catch (error: any) {
		logger.error("error listing favorites", error);
		return thunkApi.rejectWithValue({});
	}
});

export const favoriteSet = createAsyncThunk(
	"favorite/set",
	async (request: { postId: string; favorite: boolean }, thunkApi) => {
		try {
			thunkApi.dispatch(setLoadingStateAction("loading"));

			const res = await FavoriteService.setFavorite(request.postId, request.favorite);
			if (res.result == "success") {
				return { favorites: res.favorites };
			} else {
				thunkApi.dispatch(notify(res.message, "error"));
				return thunkApi.rejectWithValue({});
			}
		} catch (error: any) {
			logger.error("error setting favorite", error);
			return thunkApi.rejectWithValue({});
		}
	}
);

const initialState: FavoriteState = {
	favorites: [],
	loadingState: "initial"
};

export const FavoriteSlice = createSlice({
	name: "favorite",
	initialState,
	reducers: {
		setLoadingState
	},
	extraReducers: builder => {
		builder.addCase(favoriteList.fulfilled, (state, action) => {
			state.favorites = action.payload.favorites;
			state.loadingState = "ready";
		});
		builder.addCase(favoriteList.rejected, (state, action) => {
			state.loadingState = "initial";
		});

		builder.addCase(favoriteSet.fulfilled, (state, action) => {
			state.favorites = action.payload.favorites;
			state.loadingState = "ready";
		});
		builder.addCase(favoriteSet.rejected, (state, action) => {
			state.loadingState = "initial";
		});
	}
});

export default FavoriteSlice.reducer as Reducer<FavoriteState>;
export const selectFavoriteState = (state: RootState) => state.favorite;
