/** @format */
import {
	Backdrop,
	Button,
	Container,
	FormControlLabel,
	FormGroup,
	Stack,
	Switch,
	TextField,
	Typography
} from "@mui/material";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import * as Yup from "yup";

import LoadingSpinner from "../components/LoadingSpinner";
import { Credentials } from "../features/auth/AuthService";
import { login, selectAuthState } from "../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import i18n from "../util/Internationalization";
import { LocalSettings } from "../util/LocalSettings";

const LoginPage = () => {
	const dispatch = useAppDispatch();
	const { loginState } = useAppSelector(selectAuthState);
	const [causedLogin, setCausedLogin] = useState(false);

	const handleLogin = (credentials: Credentials) => {
		setCausedLogin(true);
		dispatch(login(credentials))
			.unwrap()
			.then(() => setCausedLogin(false));
	};

	const initialValues: Credentials = {
		username: LocalSettings.username.value || "",
		password: "",
		remember_me: false
	};

	const validationSchema = Yup.object().shape({
		username: Yup.string().required("This field is required!"),
		password: Yup.string().required("This field is required!")
	});

	const formik = useFormik({
		initialValues,
		validationSchema,
		onSubmit: handleLogin
	});

	if (loginState == "loading" && !causedLogin) {
		return (
			<Backdrop open={true}>
				<LoadingSpinner />
			</Backdrop>
		);
	}

	return (
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
					<FormGroup style={{ width: "100%" }}>
						<FormControlLabel
							control={
								<Switch
									id="remember_me"
									name="remember_me"
									checked={formik.values.remember_me}
									onChange={formik.handleChange}
								/>
							}
							label="Remember me?"
						/>
					</FormGroup>
					<Button color="primary" variant="contained" fullWidth type="submit">
						{loginState == "loading" ? <LoadingSpinner /> : <span>Login</span>}
					</Button>
				</Stack>
			</form>
		</Container>
	);
};

export default LoginPage;
