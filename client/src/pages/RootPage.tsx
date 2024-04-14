/** @format */
import { Box, Paper } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router";

import MenuBar from "../components/MenuBar";
import { loginToken, selectAuthState } from "../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { LocalSettings } from "../util/LocalSettings";
import { Util } from "../util/Util";
import LoginPage from "./LoginPage";
import { AsyncValueState } from "../features/AsyncValue";
import { userConfigGet } from "../features/user_config/UserConfigSlice";
import { tagList } from "../features/tags/TagSlice";
import { favoriteList } from "../features/favorites/FavoriteSlice";
import { postListVotes } from "../features/posts/PostSlice";

const RootPage = () => {
	const dispatch = useAppDispatch();
	const { isLoggedIn, user } = useAppSelector(selectAuthState);

	useEffect(() => {
		if (user.state != AsyncValueState.Initial) {
			return;
		}

		if (
			LocalSettings.accessToken.value &&
			Util.checkIfTokenValid(LocalSettings.accessTokenExpire.value ?? "")
		) {
			dispatch(
				loginToken({ accessToken: LocalSettings.accessToken.value })
			);
		}
	}, []);

	useEffect(() => {
		if (user.ready() && user.value) {
			dispatch(userConfigGet(null));
			dispatch(tagList(null));
			dispatch(favoriteList(null));
			dispatch(postListVotes(null));
		}
	}, [user]);

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
