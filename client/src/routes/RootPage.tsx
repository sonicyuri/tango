/** @format */

import React, { useEffect } from "react";
import { selectAuthState } from "../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import LoginPage from "./LoginPage";
import ListPage from "./ListPage";
import { Navigate, Outlet, useParams } from "react-router";
import SearchBox from "../components/SearchBox";
import { selectImageState } from "../features/images/ImageSlice";
import { useDispatch } from "react-redux";
import { tagList } from "../features/tags/TagSlice";
import { Link, useSearchParams } from "react-router-dom";
import MenuBar from "../components/MenuBar";
import { Box, Container, Paper } from "@mui/material";

const RootPage = () => {
	const dispatch = useAppDispatch();

	const { isLoggedIn, user } = useAppSelector(selectAuthState);
	const { cursor } = useAppSelector(selectImageState);
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
