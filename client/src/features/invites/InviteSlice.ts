/** @format */
import {
	CaseReducer,
	createAsyncThunk,
	createSlice,
	PayloadAction,
	Reducer
} from "@reduxjs/toolkit";
import { notify } from "reapop";

import { LogFactory, Logger } from "../../util/Logger";
import { RootState } from "../Store";
import InviteService from "./InviteService";
import FavoriteService, { InviteResponse } from "./InviteService";
import { StaticUIErrorFactory } from "../../util/UIError";
import { AsyncValue, StoredAsyncValue } from "../AsyncValue";

const logger: Logger = LogFactory.create("InviteSlice");
const errorFactory: StaticUIErrorFactory = new StaticUIErrorFactory(
	"InviteSlice"
);

const invitesValue = new AsyncValue<InviteResponse[]>("invite", "invites", []);

interface InviteState {
	invites: StoredAsyncValue<InviteResponse[]>;
}

export const inviteList = invitesValue.addAsyncAction(
	"invite/list",
	(_: null) =>
		errorFactory.wrapErrorOnly(
			InviteService.list(),
			"modules.invites.errors.list"
		)
);

export const inviteCreate = invitesValue.addAsyncAction(
	"invite/create",
	(_: null) =>
		errorFactory.wrapErrorOnly(
			InviteService.create(),
			"modules.invites.errors.create"
		)
);

export const inviteDelete = invitesValue.addAsyncAction(
	"invite/delete",
	(invite_id: string) =>
		errorFactory.wrapErrorOnly(
			InviteService.delete(invite_id),
			"modules.invites.errors.delete"
		)
);

const initialState: InviteState = {
	invites: invitesValue.storedValue
};

export const InviteSlice = createSlice({
	name: "invite",
	initialState,
	reducers: {},
	extraReducers: builder => {
		invitesValue.setupReducers(builder);
	}
});

export default InviteSlice.reducer as Reducer<InviteState>;
export const selectInviteState = (state: RootState) => state.invite;
