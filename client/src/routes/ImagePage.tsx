/** @format */

import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Credentials } from "../features/auth/AuthService";
import { LocalSettings } from "../util/LocalSettings";
import Spinner from "react-spinkit";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { login, selectAuthState } from "../features/auth/AuthSlice";
import {
	Button,
	TextField,
	Stack,
	Container,
	ImageList,
	useMediaQuery,
	useTheme,
	Box,
	Chip,
	Card,
	Paper,
	Typography,
	CardContent,
	CardHeader,
	Breadcrumbs,
	Link as MuiLink
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { imageGetById, imageList, selectImageState } from "../features/images/ImageSlice";
import { LogFactory, Logger } from "../util/Logger";
import { Util } from "../util/Util";
import { Link as RouterLink, useParams } from "react-router-dom";
import LoginPage from "./LoginPage";
import ImagePost from "../components/ImagePost";
import VideoPost from "../components/VideoPost";
import FlashPost from "../components/FlashPost";
import { TheaterComedy } from "@mui/icons-material";
import moment from "moment";

const logger: Logger = LogFactory.create("ImagePage");

const ImageExtensions = ["png", "jpg", "jpeg", "gif"];
const VideoExtensions = ["webm", "mp4", "ogv", "flv"];
const FlashExtensions = ["swf"];

const ImagePage = () => {
	const [loading, setLoading] = useState(false);

	const { isLoggedIn } = useAppSelector(selectAuthState);

	if (!isLoggedIn) 
	{
		return <LoginPage />;
	}

	const dispatch = useAppDispatch();
	const { searchState, currentImage } = useAppSelector(selectImageState);
	const params = useParams();
	const theme = useTheme();
	const useMobileLayout = useMediaQuery(theme.breakpoints.down("md"));

	if (
		searchState == "initial" &&
		((currentImage == null && params.imageId) || (currentImage != null && currentImage.id != params.imageId))
	) 
	{
		dispatch(
			imageGetById({
				imageId: params.imageId || "1"
			})
		);
	}

	if (searchState == "loading") 
	{
		return <Spinner name="wave" fadeIn="none" color="white" />;
	} 
	else if (searchState == "failed" || currentImage == null) 
	{
		return <p>failed to get image</p>;
	}

	let postContent = <p>unsupported extension {currentImage.extension}</p>;

	if (ImageExtensions.indexOf(currentImage.extension) != -1) 
	{
		postContent = <ImagePost image={currentImage} />;
	} 
	else if (VideoExtensions.indexOf(currentImage.extension) != -1) 
	{
		postContent = <VideoPost image={currentImage} />;
	} 
	else if (FlashExtensions.indexOf(currentImage.extension) != -1) 
	{
		postContent = <FlashPost image={currentImage} />;
	}

	let detailsRows: { title: string; body: string; }[] = [
		{ title: "Date posted", body: Util.formatDate(currentImage.postedAt) }
	];

	const post = <>{postContent}</>;
	const details = (
		<Stack spacing={2}>
			<Card raised={true}>
				<CardHeader title="Tags" />
				<CardContent>
					<div className="ImagePage-tags">
						{currentImage.tags.map(t => {
							return <Chip key={t} label={t} />;
						})}
					</div>
				</CardContent>
			</Card>
			<Card raised={true} className="ImagePage-details">
				<CardHeader title="Details" />
				<CardContent>
					<Stack spacing={2}>
						{detailsRows.map(d => (
							<div className="ImagePage-details-row">
								<Typography variant="subtitle2">{d.title}</Typography>
								<Typography variant="body1">{d.body}</Typography>
							</div>))}
					</Stack>
				</CardContent>
			</Card>
		</Stack>
	);

	if (useMobileLayout) 
	{
		return (
			<Stack spacing={2}>
				{post}
				{details}
			</Stack>
		);
	}

	return (
		<>
			<Breadcrumbs aria-label="breadcrumb">
				<MuiLink underline="hover" color="inherit" component={RouterLink} to="/">
					Tango
				</MuiLink>
			</Breadcrumbs>
			<Grid
				container
				spacing={3}
				sx={{
					margin: 1
				}}>
				<Grid xs={2}>{details}</Grid>
				<Grid xs={8}>{post}</Grid>
			</Grid>
		</>
	);
};

export default ImagePage;
