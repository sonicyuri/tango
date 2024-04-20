/** @format */
import { Navigate } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { selectAuthState } from "../../features/auth/AuthSlice";

import { Typography } from "@mui/material";
import { notify } from "reapop";
import { LogFactory } from "../../util/Logger";
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
