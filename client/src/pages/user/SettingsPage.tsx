/** @format */
import React, { useEffect } from "react";
import { Navigate, useRouteError } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { selectAuthState } from "../../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";

import { LogFactory } from "../../util/Logger";
import { notify } from "reapop";
import { Typography } from "@mui/material";
import moment from "moment";
import { inviteList } from "../../features/invites/InviteSlice";
import InviteList from "./components/InviteList";

const logger = LogFactory.create("SettingsPage");

const SettingsPage = () => {
	const { user } = useAppSelector(selectAuthState);
	const dispatch = useAppDispatch();

	if (!user) {
		dispatch(notify("Can't view settings without logging in!"));
		return <Navigate to="/" />;
	}

	return (
		<PageContainer title="Settings">
			<Typography variant="h5">Invites</Typography>
			<InviteList />
		</PageContainer>
	);
};

export default SettingsPage;
