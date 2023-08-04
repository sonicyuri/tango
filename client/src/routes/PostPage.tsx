/** @format */
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
	Box,
	Breadcrumbs,
	Button,
	ButtonGroup,
	Card,
	CardContent,
	CardHeader,
	Link as MuiLink,
	Stack,
	Typography,
	useMediaQuery,
	useTheme
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Spinner from "react-spinkit";
import { useSwipeable } from "react-swipeable";

import FlashPost from "../components/FlashPost";
import ImagePost from "../components/ImagePost";
import TagsCard from "../components/TagsCard";
import VideoPost from "../components/VideoPost";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { postDirectLink, postViewById, selectPostState } from "../features/posts/PostSlice";
import i18n from "../util/Internationalization";
import { LogFactory, Logger } from "../util/Logger";
import { Util } from "../util/Util";

const logger: Logger = LogFactory.create("PostPage");

const ImageExtensions = ["png", "jpg", "jpeg", "gif"];
const VideoExtensions = ["webm", "mp4", "ogv", "flv"];
const FlashExtensions = ["swf"];

/**
 * Page representing a single post, allowing the post to be viewed and edited.
 */
const PostPage = () => {
	const dispatch = useAppDispatch();
	const { searchState, currentPost, cursor } = useAppSelector(selectPostState);
	const params = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const theme = useTheme();
	const navigate = useNavigate();

	const [editing, setEditing] = useState(false);

	// handles navigating left-right based on swipe, keys, or buttons
	const handleNavigate = (direction: 1 | -1) => {
		navigate(cursor?.makePostLinkNavigate(direction) || "/posts");
	};

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (editing) {
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
	const useMobileLayout = useMediaQuery(theme.breakpoints.down("lg"));

	//
	useEffect(() => {
		if (cursor != null) {
			dispatch(postViewById({ postId: params.postId || "1" }));
		} else {
			dispatch(
				postDirectLink({
					postId: params.postId || "1",
					query: searchParams.get("q"),
					page: Number(searchParams.get("page") || "1") || 1
				})
			);
		}
	}, [params.postId]);

	// NO HOOKS BELOW THIS POINT - early returns start here

	if (searchState == "loading") {
		// TODO: nicer loading with blank info instead of simply nothing?
		return <Spinner name="wave" fadeIn="none" color="white" />;
	} else if (searchState == "failed" || currentPost == null) {
		return Util.logAndDisplayError(logger, "failed to obtain post", currentPost);
	}

	// choose which component to use based on extension
	let postContent = <></>;
	let needsSwipeListener = false;

	if (ImageExtensions.indexOf(currentPost.extension) != -1) {
		postContent = <ImagePost post={currentPost} />;
	} else if (VideoExtensions.indexOf(currentPost.extension) != -1) {
		postContent = <VideoPost post={currentPost} swipe={swipeHandlers} />;
		// video element steals events needed for detecting swipe
		needsSwipeListener = true;
	} else if (FlashExtensions.indexOf(currentPost.extension) != -1) {
		postContent = <FlashPost post={currentPost} />;
	} else {
		postContent = Util.logAndDisplayError(logger, "unsupported extension {currentPost.extension}", currentPost);
	}

	// the section of the page containing the post itself
	const post = (
		<>
			<div className="PostPage-content">{postContent}</div>
		</>
	);

	// set up detail rows
	const genericDetailRow = (body: string) => <Typography variant="body1">{body}</Typography>;

	// TODO: fix downloads (actually download, don't redirect)
	const downloadLink = (
		<MuiLink href={currentPost.videoUrl} download={currentPost.hash + "." + currentPost.extension} underline="none">
			Download File
		</MuiLink>
	);

	const detailsRows: { title?: string; body: JSX.Element }[] = [
		{ title: "Date posted", body: genericDetailRow(Util.formatDate(currentPost.postedAt)) },
		{ title: "File size", body: genericDetailRow(Util.formatBytes(currentPost.fileSize)) },
		{ body: downloadLink }
	];

	const details = (
		<Stack spacing={2}>
			<TagsCard post={currentPost} onEditingChanged={edit => setEditing(edit)} />
			<Card raised={true} className="PostPage-details">
				<CardHeader title="Details" />
				<CardContent>
					<Stack spacing={2}>
						{detailsRows.map(d => (
							<div className="PostPage-details-row" key={"row-" + d.title}>
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

	const postsUrl = cursor?.makePostsLink() || "/posts";
	const breadcrumbs = (
		<Breadcrumbs aria-label="breadcrumb">
			<MuiLink underline="hover" color="inherit" component={RouterLink} to="/">
				{i18n.t("siteTitle")}
			</MuiLink>
			<MuiLink underline="hover" color="inherit" component={RouterLink} to={postsUrl}>
				Posts
			</MuiLink>
			<Typography color="text.primary">Post {currentPost.id}</Typography>
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
		<Box className="PostPage" {...swipeHandlers}>
			<div className="PageHeader PostPage-header">
				{breadcrumbs}
				<ButtonGroup variant="contained" aria-label="prev/next post">
					<Button onClick={() => handleNavigate(-1)} disabled={!(cursor?.canMove(-1) || false)}>
						<ArrowBackIcon />
					</Button>
					<Button disabled>Post {currentPost.id}</Button>
					<Button onClick={() => handleNavigate(1)} disabled={!(cursor?.canMove(1) || false)}>
						<ArrowForwardIcon />
					</Button>
				</ButtonGroup>
			</div>
			<div className="PostPage-contents">{useMobileLayout ? mobileLayout : desktopLayout}</div>
		</Box>
	);
};

export default PostPage;
