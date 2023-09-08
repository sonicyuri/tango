/** @format */
//import { DataGrid, GridColDef, GridRowsProp } from "@mui/x-data-grid";
import React from "react";
import { Navigate } from "react-router-dom";
import { notify } from "reapop";

import LoadingSpinner from "../../components/LoadingSpinner";
import PageContainer from "../../components/PageContainer";
import { selectAuthState } from "../../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { selectTagAliasState } from "../../features/tags/TagAliasSlice";
import { LogFactory } from "../../util/Logger";

const logger = LogFactory.create("TagAliasPage");

const TagAliasPage = () => {
	const { user } = useAppSelector(selectAuthState);
	const dispatch = useAppDispatch();

	const { tagAliases, loadingState: tagAliasState } = useAppSelector(selectTagAliasState);

	if (!user || user.class != "admin") {
		dispatch(notify("Missing permissions!", "error"));
		return <Navigate to="/" />;
	}

	/*const cols: GridColDef[] = [
		{ field: "oldTag", headerName: "Old Tag", width: 300 },
		{ field: "newTag", headerName: "New Tag", width: 300 }
	];

	const rows: GridRowsProp = Object.keys(tagAliases).map(oldTag => ({
		id: oldTag,
		oldTag,
		newTag: tagAliases[oldTag]
	}));*/

	const table = <></>; //<DataGrid rows={rows} columns={cols} />;

	return <PageContainer title="Tag Aliases">{tagAliasState == "ready" ? table : <LoadingSpinner />}</PageContainer>;
};

export default TagAliasPage;
