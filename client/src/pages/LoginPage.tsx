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
import { useState } from "react";
import * as Yup from "yup";

import LoadingSpinner from "../components/LoadingSpinner";
import { Credentials } from "../features/auth/AuthSchema";
import { login, selectAuthState } from "../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import i18n from "../util/Internationalization";
import { LocalSettings } from "../util/LocalSettings";

import { Link as RouterLink } from "react-router-dom";
import { AsyncValueState } from "../features/AsyncValue";

const LoginPage = () => {
	const dispatch = useAppDispatch();
	const { user } = useAppSelector(selectAuthState);
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

	if (user.state == AsyncValueState.Loading && !causedLogin) {
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
						error={
							formik.touched.username &&
							Boolean(formik.errors.username)
						}
						helperText={
							formik.touched.username && formik.errors.username
						}
					/>
					<TextField
						fullWidth
						id="password"
						name="password"
						label="Password"
						type="password"
						value={formik.values.password}
						onChange={formik.handleChange}
						error={
							formik.touched.password &&
							Boolean(formik.errors.password)
						}
						helperText={
							formik.touched.password && formik.errors.password
						}
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
					<Button
						color="primary"
						variant="contained"
						fullWidth
						type="submit">
						{user.state == AsyncValueState.Loading ? (
							<LoadingSpinner />
						) : (
							<span>Login</span>
						)}
					</Button>
					<Button
						color="primary"
						variant="outlined"
						fullWidth
						component={RouterLink}
						to="/signup">
						Create Account
					</Button>
				</Stack>
			</form>
		</Container>
	);
};

export default LoginPage;
