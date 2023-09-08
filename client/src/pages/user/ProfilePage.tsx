/** @format */
import React from "react";
import { Navigate, useRouteError } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { selectAuthState } from "../../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { UserClass } from "../../../../shared";

import { LogFactory } from "../../util/Logger";
import { notify } from "reapop";
import { Typography } from "@mui/material";
import moment from "moment";

const logger = LogFactory.create("ProfilePage");

const ProfilePage = () => {
	const { user } = useAppSelector(selectAuthState);
	const dispatch = useAppDispatch();

	if (!user) {
		dispatch(notify("Can't view profile without logging in!"));
		return <Navigate to="/" />;
	}

	return (
		<PageContainer title="Profile">
			<Typography variant="subtitle1">{user.username}</Typography>
			<Typography variant="body1">Class: {user?.class}</Typography>
			<Typography variant="body1">
				Joined: {moment(user.joinedAt).format("dddd, MMMM Do YYYY, h:mm:ss a")}
			</Typography>
		</PageContainer>
	);
};

export default ProfilePage;
