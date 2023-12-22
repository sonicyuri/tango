/** @format */
import {
	Backdrop,
	Button,
	Container,
	FormControlLabel,
	FormGroup,
	Paper,
	Stack,
	Switch,
	TextField,
	Typography
} from "@mui/material";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import * as Yup from "yup";

import LoadingSpinner from "../components/LoadingSpinner";
import { Credentials, SignupRequest } from "../features/auth/AuthService";
import { login, selectAuthState, signup } from "../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import i18n from "../util/Internationalization";
import { LocalSettings } from "../util/LocalSettings";

import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";

type State = SignupRequest & { password_confirm: string };

const SignupPage = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { isLoggedIn, user, loginState } = useAppSelector(selectAuthState);

	const handleSignup = (credentials: State) => {
		dispatch(signup({
			username: credentials.username,
			password: credentials.password,
			email: credentials.email,
			invite_code: credentials.invite_code
		}))
			.unwrap()
			.then(() => navigate("/"));
	};

	const initialValues: State = {
		username: "",
		password: "",
		password_confirm: "",
		email: null,
		invite_code: null
	};

	const validationSchema = Yup.object().shape({
		username: Yup.string().required("This field is required!"),
		password: Yup.string().required("This field is required!"),
		password_confirm: Yup.string().required("This field is required!").oneOf([Yup.ref("password")], "Passwords must match"),
		email: Yup.string().nullable().email("Field must be an email").optional(),
		invite_code: Yup.string().required("This field is required!").matches(/^[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}$/, "Invite codes look like xxxx-xxxx")
	});

	const formik = useFormik({
		initialValues,
		validationSchema,
		onSubmit: handleSignup
	});

	
	if (isLoggedIn)
	{
		return <Navigate to="/" />;
	}

	return (
		<Paper
			sx={{
				minHeight: "100vh",
				borderRadius: 0
			}}>
			<Container
				maxWidth="sm"
				style={{
					height: "100%",
					display: "flex",
					alignItems: "center"
				}}>
				<form
					onSubmit={formik.handleSubmit}
					style={{
						width: "100%"
					}}>
					<Stack spacing={2} alignItems="center">
						<Typography
							variant="h1"
							sx={{
								display: "block"
							}}>
							{i18n.t("siteTitle")}
						</Typography>
						<TextField
							fullWidth
							id="username"
							name="username"
							label="Username"
							value={formik.values.username}
							onChange={formik.handleChange}
							error={formik.touched.username && Boolean(formik.errors.username)}
							helperText={formik.touched.username && formik.errors.username}
						/>
						<TextField
							fullWidth
							id="password"
							name="password"
							label="Password"
							type="password"
							value={formik.values.password}
							onChange={formik.handleChange}
							error={formik.touched.password && Boolean(formik.errors.password)}
							helperText={formik.touched.password && formik.errors.password}
						/>
						<TextField
							fullWidth
							id="password_confirm"
							name="password_confirm"
							label="Confirm Password"
							type="password"
							value={formik.values.password_confirm}
							onChange={formik.handleChange}
							error={formik.touched.password_confirm && Boolean(formik.errors.password_confirm)}
							helperText={formik.touched.password_confirm && formik.errors.password_confirm}
						/>
						<TextField
							fullWidth
							id="email"
							name="email"
							label="Email (optional)"
							type="email"
							value={formik.values.email}
							onChange={formik.handleChange}
							error={formik.touched.email && Boolean(formik.errors.email)}
							helperText={formik.touched.email && formik.errors.email}
						/>
						<TextField
							fullWidth
							id="invite_code"
							name="invite_code"
							label="Invite Code"
							value={formik.values.invite_code}
							onChange={formik.handleChange}
							error={formik.touched.invite_code && Boolean(formik.errors.invite_code)}
							helperText={formik.touched.invite_code && formik.errors.invite_code}
						/>
						<Button color="primary" variant="contained" fullWidth type="submit">
							{loginState == "loading" ? <LoadingSpinner /> : <span>Create Account</span>}
						</Button>
						<Button color="primary" variant="outlined" fullWidth component={RouterLink} to="/">
							Login
						</Button>
					</Stack>
				</form>
			</Container>
		</Paper>
	);
};

export default SignupPage;
