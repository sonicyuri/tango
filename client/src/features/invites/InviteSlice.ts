/** @format */
import { CaseReducer, createAsyncThunk, createSlice, PayloadAction, Reducer } from "@reduxjs/toolkit";
import { notify } from "reapop";

import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import InviteService from "./InviteService";
import FavoriteService, { InviteResponse } from "./InviteService";

const logger: Logger = LogFactory.create("InviteSlice");

type InviteLoadingState = "initial" | "loading" | "ready";

interface InviteState {
	invites: InviteResponse[];
	loadingState: InviteLoadingState;
}

const setLoadingState: CaseReducer<InviteState, PayloadAction<InviteLoadingState>> = (state, action) => {
	state.loadingState = action.payload;
};

const setLoadingStateAction = (newState: InviteLoadingState): PayloadAction<InviteLoadingState> => ({
	type: "invite/setLoadingState",
	payload: newState
});

export const inviteList = createAsyncThunk("invite/list", async (_: null, thunkApi) => {
	try {
		thunkApi.dispatch(setLoadingStateAction("loading"));

		const res = await InviteService.list();
		if (res.type == "success") {
			return { invites: res.result };
		} else {
			logger.error("error listing invites", res.message);
			thunkApi.dispatch(notify("Error listing invites: " + res.message, "error"));
			return thunkApi.rejectWithValue({});
		}
	} catch (error: any) {
		logger.error("error listing invites", error);
		thunkApi.dispatch(notify("Error listing invites", "error"));
		return thunkApi.rejectWithValue({});
	}
});

export const inviteCreate = createAsyncThunk(
	"invite/create",
	async (request: null, thunkApi) => {
		try {
			thunkApi.dispatch(setLoadingStateAction("loading"));

			const res = await InviteService.create();
			if (res.type == "success") {
				return { invites: res.result };
			} else {
				logger.error("error creating invite", res.message);
				thunkApi.dispatch(notify("Failed to create invite: " + res.message, "error"));
				return thunkApi.rejectWithValue({});
			}
		} catch (error: any) {
			logger.error("error creating invite", error);
			thunkApi.dispatch(notify("Failed to create invite", "error"));
			return thunkApi.rejectWithValue({});
		}
	}
);

export const inviteDelete = createAsyncThunk(
	"invite/delete",
	async (invite_id: string, thunkApi) => {
		try {
			thunkApi.dispatch(setLoadingStateAction("loading"));

			const res = await InviteService.delete(invite_id);
			if (res.type == "success") {
				return { invites: res.result };
			} else {
				logger.error("error deleting invite", res.message);
				thunkApi.dispatch(notify("Failed to delete invite: " + res.message, "error"));
				return thunkApi.rejectWithValue({});
			}
		} catch (error: any) {
			logger.error("error deleting invite", error);
			thunkApi.dispatch(notify("Failed to delete invite", "error"));
			return thunkApi.rejectWithValue({});
		}
	}
);

const initialState: InviteState = {
	invites: [],
	loadingState: "initial"
};

export const InviteSlice = createSlice({
	name: "invite",
	initialState,
	reducers: {
		setLoadingState
	},
	extraReducers: builder => {
		builder.addCase(inviteList.fulfilled, (state, action) => {
			state.invites = action.payload.invites;
			state.loadingState = "ready";
		});
		builder.addCase(inviteList.rejected, (state, action) => {
			state.loadingState = "initial";
		});

		builder.addCase(inviteCreate.fulfilled, (state, action) => {
			state.invites = action.payload.invites;
			state.loadingState = "ready";
		});
		builder.addCase(inviteCreate.rejected, (state, action) => {
			state.loadingState = "initial";
		});

		builder.addCase(inviteDelete.fulfilled, (state, action) => {
			state.invites = action.payload.invites;
			state.loadingState = "ready";
		});
		builder.addCase(inviteDelete.rejected, (state, action) => {
			state.loadingState = "initial";
		});
	}
});

export default InviteSlice.reducer as Reducer<InviteState>;
export const selectInviteState = (state: RootState) => state.invite;
