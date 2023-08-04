/** @format */
import { Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import Spinner from "react-spinkit";
import * as Yup from "yup";

import { Credentials } from "../features/auth/AuthService";
import { login } from "../features/auth/AuthSlice";
import { useAppDispatch } from "../features/Hooks";
import i18n from "../util/Internationalization";
import { LocalSettings } from "../util/LocalSettings";

const LoginPage = () => {
	const [loading, setLoading] = useState(false);

	const dispatch = useAppDispatch();

	const handleLogin = (credentials: Credentials) => {
		setLoading(true);

		dispatch(login(credentials))
			.unwrap()
			.catch(() => setLoading(false));
	};

	const initialValues: Credentials = {
		username: LocalSettings.username.value || "",
		password: LocalSettings.password.value || ""
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

	useEffect(() => {
		if (initialValues.username.length > 0 && initialValues.password.length > 0) {
			setLoading(true);
			dispatch(login(initialValues))
				.unwrap()
				.catch(() => setLoading(false));
		}
	}, []);

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
					<Button color="primary" variant="contained" fullWidth type="submit">
						{loading ? <Spinner name="wave" fadeIn="none" color="white" /> : <span>Login</span>}
					</Button>
				</Stack>
			</form>
		</Container>
	);
};

export default LoginPage;
