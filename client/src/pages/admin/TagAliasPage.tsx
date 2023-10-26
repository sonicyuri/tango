/** @format */
//import { DataGrid, GridColDef, GridRowsProp } from "@mui/x-data-grid";
import { TablePagination } from "@mui/material";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { notify } from "reapop";

import { UserClass } from "../models/user_classes/UserClass";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageContainer from "../../components/PageContainer";
import { selectAuthState } from "../../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { selectTagAliasState, tagAliasList } from "../../features/tags/TagAliasSlice";
import { LogFactory } from "../../util/Logger";

const logger = LogFactory.create("TagAliasPage");

const TagAliasPage = () => {
	const { user } = useAppSelector(selectAuthState);
	const dispatch = useAppDispatch();

	const [page, setPage] = React.useState(0);
	const [rowsPerPage, setRowsPerPage] = React.useState(10);

	const handleChangePage = (event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(+event.target.value);
		setPage(0);
	};

	const { tagAliases, loadingState: tagAliasState } = useAppSelector(selectTagAliasState);

	if (!user || !UserClass.canClass(user.class, "manage_alias_list")) {
		dispatch(notify("Missing permissions!", "error"));
		return <Navigate to="/" />;
	}

	useEffect(() => {
		dispatch(tagAliasList(null));
	}, [user]);

	const tags = Object.keys(tagAliases)
		.sort()
		.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	const table = (
		<>
			<TableContainer sx={{ maxHeight: "90vh" }}>
				<Table stickyHeader aria-label="aliases table">
					<TableHead>
						<TableRow>
							<TableCell align="left" style={{ minWidth: 200 }}>
								Old Tag
							</TableCell>
							<TableCell align="left" style={{ minWidth: 200 }}>
								New Tag
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{tags.map(oldTag => {
							const newTag = tagAliases[oldTag];
							return (
								<TableRow hover role="checkbox" tabIndex={-1} key={oldTag}>
									<TableCell align="left">{oldTag}</TableCell>
									<TableCell align="left">{newTag}</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				component="div"
				rowsPerPageOptions={[10, 25, 50]}
				count={Object.keys(tagAliases).length}
				rowsPerPage={rowsPerPage}
				page={page}
				onPageChange={handleChangePage}
				onRowsPerPageChange={handleChangeRowsPerPage}
			/>
		</>
	);

	return <PageContainer title="Tag Aliases">{tagAliasState == "ready" ? table : <LoadingSpinner />}</PageContainer>;
};

export default TagAliasPage;
