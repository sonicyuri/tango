/** @format */
import { Box, Paper } from "@mui/material";
import React, { useEffect } from "react";
import { Outlet } from "react-router";
import { useSearchParams } from "react-router-dom";

import MenuBar from "../components/MenuBar";
import { selectAuthState } from "../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { selectPostState } from "../features/posts/PostSlice";
import LoginPage from "./LoginPage";

const RootPage = () => {
	const dispatch = useAppDispatch();

	const { isLoggedIn, user } = useAppSelector(selectAuthState);
	const { cursor } = useAppSelector(selectPostState);
	const [params, setParams] = useSearchParams();

	const body = (
		<>
			<MenuBar />
			<Box
				sx={{
					pt: 1
				}}>
				<Outlet />
			</Box>
		</>
	);

	return (
		<Paper
			sx={{
				minHeight: "100vh",
				borderRadius: 0
			}}>
			{isLoggedIn ? body : <LoginPage />}
		</Paper>
	);
};

export default RootPage;
