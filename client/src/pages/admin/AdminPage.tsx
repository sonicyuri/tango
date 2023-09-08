/** @format */
import React from "react";
import { Navigate, useRouteError } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { selectAuthState } from "../../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { UserClass } from "../../../../shared";

import { LogFactory } from "../../util/Logger";
import { notify } from "reapop";

const logger = LogFactory.create("AdminPage");

const AdminPage = () => {
	const { user } = useAppSelector(selectAuthState);
	const dispatch = useAppDispatch();

	if (!user || !UserClass.canClass(user.class, "manage_admintools")) {
		dispatch(notify("Missing permissions!", "error"));
		return <Navigate to="/" />;
	}

	return <PageContainer title="Admin"></PageContainer>;
};

export default AdminPage;
