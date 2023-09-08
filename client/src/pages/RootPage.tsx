/** @format */
import { Box, Paper } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router";

import MenuBar from "../components/MenuBar";
import { loginToken, refresh, selectAuthState } from "../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { LocalSettings } from "../util/LocalSettings";
import { Util } from "../util/Util";
import LoginPage from "./LoginPage";

let alreadyAutoLoggedInFlag = false;

const RootPage = () => {
	const dispatch = useAppDispatch();
	const { isLoggedIn, user, loginState } = useAppSelector(selectAuthState);

	useEffect(() => {
		if (loginState != "initial" || alreadyAutoLoggedInFlag) {
			return;
		}

		if (LocalSettings.accessToken.value && Util.checkIfTokenValid(LocalSettings.accessTokenExpire.value ?? "")) {
			alreadyAutoLoggedInFlag = true;
			dispatch(
				loginToken({
					accessToken: LocalSettings.accessToken.value,
					refreshToken: LocalSettings.refreshToken.value
				})
			);
		} else if (
			LocalSettings.refreshToken.value &&
			Util.checkIfTokenValid(LocalSettings.refreshTokenExpire.value ?? "")
		) {
			alreadyAutoLoggedInFlag = true;
			dispatch(refresh(LocalSettings.refreshToken.value));
		}
	}, []);

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
