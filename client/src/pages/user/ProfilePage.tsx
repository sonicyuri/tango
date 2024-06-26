/** @format */
import { Navigate } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { selectAuthState } from "../../features/auth/AuthSlice";

import { Typography } from "@mui/material";
import moment from "moment";
import { notify } from "reapop";
import { LogFactory } from "../../util/Logger";

const logger = LogFactory.create("ProfilePage");

const ProfilePage = () => {
	const { user: userValue } = useAppSelector(selectAuthState);
	const dispatch = useAppDispatch();

	const user = userValue.value;

	if (!user) {
		dispatch(notify("Can't view profile without logging in!"));
		return <Navigate to="/" />;
	}

	return (
		<PageContainer title="Profile">
			<Typography variant="subtitle1">{user.username}</Typography>
			<Typography variant="body1">Class: {user?.class}</Typography>
			<Typography variant="body1">
				Joined:{" "}
				{moment(user.joinedAt).format("dddd, MMMM Do YYYY, h:mm:ss a")}
			</Typography>
		</PageContainer>
	);
};

export default ProfilePage;
