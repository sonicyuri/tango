/** @format */
import React from "react";
import { Link, Navigate, useRouteError } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { selectAuthState } from "../../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";

import { LogFactory } from "../../util/Logger";
import { notify } from "reapop";
import { Button, List } from "@mui/material";
import OptionsList, { OptionsListItem } from "../../components/OptionsList";
import { ListAlt } from "@mui/icons-material";

const logger = LogFactory.create("AdminPage");

const AdminPage = () => {
	const { user } = useAppSelector(selectAuthState);
	const dispatch = useAppDispatch();

	if (!user || user.class != "admin") {
		dispatch(notify("Missing permissions!", "error"));
		return <Navigate to="/" />;
	}

	const menuItems: OptionsListItem[] = [
		{
			text: "Edit Aliases",
			url: "/tags/aliases",
			icon: <ListAlt />
		}
	];

	return (
		<PageContainer title="Admin">
			<OptionsList menuItems={menuItems} />
		</PageContainer>
	);
};

export default AdminPage;
