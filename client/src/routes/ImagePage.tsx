/** @format */

import React, { useEffect, useState } from "react";
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
	Link as MuiLink,
	ButtonGroup,
	CardActions
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { imageDirectLink, imageList, imageNavigate, selectImageState } from "../features/images/ImageSlice";
import { LogFactory, Logger } from "../util/Logger";
import { Util } from "../util/Util";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import LoginPage from "./LoginPage";
import ImagePost from "../components/ImagePost";
import VideoPost from "../components/VideoPost";
import FlashPost from "../components/FlashPost";
import i18n from "../util/Internationalization";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useSwipeable } from "react-swipeable";
import TagsCard from "../components/TagsCard";

const logger: Logger = LogFactory.create("ImagePage");

const ImageExtensions = ["png", "jpg", "jpeg", "gif"];
const VideoExtensions = ["webm", "mp4", "ogv", "flv"];
const FlashExtensions = ["swf"];

const ImagePage = () => {
	const dispatch = useAppDispatch();
	const { searchState, currentImage, cursor } = useAppSelector(selectImageState);
	const params = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const theme = useTheme();
	const navigate = useNavigate();

	const [editing, setEditing] = useState(false);

	const handleNavigate = (direction: 1 | -1) => {
		dispatch(imageNavigate(direction))
			.unwrap()
			.then(action => {
				if (action.image) {
					navigate(cursor?.makeImageLink(action.image) || "/images/view/" + action.image.id);
				}
			});
	};

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent)
		{
			if (editing)
			{
				return;
			}
			
			if (e.key == "ArrowLeft" || e.key == "a") {
				handleNavigate(-1);
			} else if (e.key == "ArrowRight" || e.key == "d") {
				handleNavigate(1);
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	});

	// set up swiping
	const swipeHandlers = useSwipeable({
		onSwipedLeft: eventData => {
			if (!editing) {
				handleNavigate(1);
			}
		},
		onSwipedRight: eventData => {
			if (!editing) {
				handleNavigate(-1);
			}
		}
	});

	// if we're on too small of a screen, we want to arrange it vertically instead of horizontally
	const useMobileLayout = useMediaQuery(theme.breakpoints.down("md"));

	// we've arrived at this page without an image already loaded, meaning we followed a direct link
	// so we need to launch an imageGetById request to bring us up to speed
	if (
		searchState == "initial" &&
		((currentImage == null && params.imageId) || (currentImage != null && currentImage.id != params.imageId))
	) {
		dispatch(
			imageDirectLink({
				imageId: params.imageId || "1",
				query: searchParams.get("q"),
				page: Number(searchParams.get("page") || "1") || 1
			})
		);

		return <></>;
	}

	if (searchState == "loading") {
		// TODO: nicer loading with blank info instead of simply nothing?
		return <Spinner name="wave" fadeIn="none" color="white" />;
	} else if (searchState == "failed" || currentImage == null) {
		return Util.logAndDisplayError(logger, "failed to obtain image", currentImage);
	}

	// choose which component to use based on extension
	let postContent = <></>;
	let needsSwipeListener = false;

	if (ImageExtensions.indexOf(currentImage.extension) != -1) {
		postContent = <ImagePost image={currentImage} />;
	} else if (VideoExtensions.indexOf(currentImage.extension) != -1) {
		postContent = <VideoPost image={currentImage} swipe={swipeHandlers} />;
		// video element steals events needed for detecting swipe
		needsSwipeListener = true;
	} else if (FlashExtensions.indexOf(currentImage.extension) != -1) {
		postContent = <FlashPost image={currentImage} />;
	} else {
		postContent = Util.logAndDisplayError(logger, "unsupported extension {currentImage.extension}", currentImage);
	}

	// the section of the page containing the post itself
	const post = (
		<>
			<div className="ImagePage-content">{postContent}</div>
		</>
	);

	// set up detail rows
	const genericDetailRow = (body: string) => <Typography variant="body1">{body}</Typography>;

	// TODO: fix downloads (actually download, don't redirect)
	const downloadLink = (
		<MuiLink
			href={currentImage.videoUrl}
			download={currentImage.hash + "." + currentImage.extension}
			underline="none">
			Download File
		</MuiLink>
	);

	let detailsRows: { title?: string; body: JSX.Element }[] = [
		{ title: "Date posted", body: genericDetailRow(Util.formatDate(currentImage.postedAt)) },
		{ title: "File size", body: genericDetailRow(Util.formatBytes(currentImage.fileSize)) },
		{ body: downloadLink }
	];

	const details = (
		<Stack spacing={2}>
			<TagsCard image={currentImage} onEditingChanged={edit => setEditing(edit)} />
			<Card raised={true} className="ImagePage-details">
				<CardHeader title="Details" />
				<CardContent>
					<Stack spacing={2}>
						{detailsRows.map(d => (
							<div className="ImagePage-details-row" key={"row-" + d.title}>
								{d.title ? (
									<Typography variant="subtitle2" key={"title-" + d.title}>
										{d.title}
									</Typography>
								) : (
									<></>
								)}
								{d.body}
							</div>
						))}
					</Stack>
				</CardContent>
			</Card>
		</Stack>
	);

	const imagesUrl = cursor?.makeImagesLink() || "/images";
	const breadcrumbs = (
		<Breadcrumbs aria-label="breadcrumb">
			<MuiLink underline="hover" color="inherit" component={RouterLink} to="/">
				{i18n.t("siteTitle")}
			</MuiLink>
			<MuiLink underline="hover" color="inherit" component={RouterLink} to={imagesUrl}>
				Images
			</MuiLink>
			<Typography color="text.primary">Image {currentImage.id}</Typography>
		</Breadcrumbs>
	);

	const mobileLayout = (
		<Stack spacing={2}>
			{post}
			{details}
		</Stack>
	);

	const desktopLayout = (
		<Grid container spacing={3} sx={{ maxWidth: "100%" }}>
			<Grid xs={2}>{details}</Grid>
			<Grid xs={10}>{post}</Grid>
		</Grid>
	);

	return (
		<Box className="ImagePage" {...swipeHandlers}>
			<div className="PageHeader ImagePage-header">
				{breadcrumbs}
				<ButtonGroup variant="contained" aria-label="prev/next image">
					<Button onClick={() => handleNavigate(-1)} disabled={!(cursor?.canMove(-1) || false)}>
						<ArrowBackIcon />
					</Button>
					<Button disabled>Image {currentImage.id}</Button>
					<Button onClick={() => handleNavigate(1)} disabled={!(cursor?.canMove(1) || false)}>
						<ArrowForwardIcon />
					</Button>
				</ButtonGroup>
			</div>
			<div className="ImagePage-contents">{useMobileLayout ? mobileLayout : desktopLayout}</div>
		</Box>
	);
};

export default ImagePage;
