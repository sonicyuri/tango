/** @format */
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
	Box,
	Breadcrumbs,
	Button,
	ButtonGroup,
	Link as MuiLink,
	Stack,
	Typography,
	useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/system";
import Grid from "@mui/material/Unstable_Grid2";
import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSwipeable } from "react-swipeable";

import LoadingSpinner from "../../components/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { postDirectLink, postViewById, postVote, selectPostState } from "../../features/posts/PostSlice";
import i18n from "../../util/Internationalization";
import { LogFactory, Logger } from "../../util/Logger";
import { Util } from "../../util/Util";
import DetailsCard from "./components/DetailsCard";
import FlashPost from "./components/FlashPost";
import ImagePost from "./components/ImagePost";
import TagsCard from "./components/TagsCard";
import VideoPost from "./components/VideoPost";
import VrPost from "./components/VrPost";
import { BooruPost } from "../../models/BooruPost";
import PostActions from "./components/PostActions";
import { favoriteSet, selectFavoriteState } from "../../features/favorites/FavoriteSlice";
import { VoteRequest } from "../../features/posts/PostService";

const logger: Logger = LogFactory.create("PostPage");

const ImageExtensions = ["png", "jpg", "jpeg", "gif"];
const VideoExtensions = ["webm", "mp4", "ogv", "flv"];
const FlashExtensions = ["swf"];

/**
 * Page representing a single post, allowing the post to be viewed and edited.
 */
const PostPage = () => {
	const dispatch = useAppDispatch();
	const params = useParams();
	const theme = useTheme();
	const navigate = useNavigate();

	const { searchState, currentPost: _currentPost, cursor, votes } = useAppSelector(selectPostState);
	const { favorites } = useAppSelector(selectFavoriteState);

	const [searchParams] = useSearchParams();
	const [editing, setEditing] = useState(false);

	// use a dummy post if real post isn't available
	let currentPost =
		_currentPost ??
		new BooruPost({
			id: "0",
			width: 0,
			height: 0,
			filesize: 0,
			hash: "",
			ext: "dummy",
			mime: "",
			posted: 0,
			source: null,
			owner_id: "",
			pools: [],
			numeric_score: 0,
			tags: []
		});

	const vote = votes[currentPost.id] ?? 0;
	const favorite = favorites.includes(currentPost.id);

	// handles navigating left-right based on swipe, keys, or buttons
	const handleNavigate = (direction: 1 | -1) => {
		navigate(cursor?.makePostLinkNavigate(direction) || "/posts");
	};

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			let elem = e.target as HTMLElement;
			if (elem != null && (elem.tagName == "INPUT" || elem.tagName == "SELECT" || elem.tagName == "TEXTAREA")) {
				return;
			}

			if (e.key == "ArrowLeft" || e.key == "a") {
				handleNavigate(-1);
			} else if (e.key == "ArrowRight" || e.key == "d") {
				handleNavigate(1);
			} else if (e.key == "ArrowUp" || e.key == "w") {
				dispatch(postVote({ post_id: currentPost.id, action: vote == 1 ? "clear" : "up" }));
			} else if (e.key == "ArrowDown" || e.key == "s") {
				dispatch(postVote({ post_id: currentPost.id, action: vote == -1 ? "clear" : "down" }));
			} else if (e.key == "f") {
				dispatch(favoriteSet({ postId: currentPost.id, favorite: !favorite }));
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	});

	// set up swiping
	const swipeHandlers = useSwipeable({
		onSwipedLeft: () => {
			if (!editing) {
				handleNavigate(1);
			}
		},
		onSwipedRight: () => {
			if (!editing) {
				handleNavigate(-1);
			}
		}
	});

	// if we're on too small of a screen, we want to arrange it vertically instead of horizontally
	const useMobileLayout = useMediaQuery(theme.breakpoints.down("lg"));

	//
	useEffect(() => {
		document.title = Util.formatTitle("Post " + params.postId);

		if (cursor != null && cursor.hasPost(params.postId || "")) {
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
	if (searchState == "failed") {
		return Util.logAndDisplayError(logger, "failed to obtain post", currentPost);
	}

	// choose which component to use based on extension
	let postContent = <></>;
	let needsSwipeListener = false;

	if (currentPost.extension == "dummy") {
		postContent = <></>;
	} else if (ImageExtensions.indexOf(currentPost.extension) != -1) {
		postContent = <ImagePost post={currentPost} />;
	} else if (VideoExtensions.indexOf(currentPost.extension) != -1) {
		postContent =
			currentPost.tags.indexOf("vr") != -1 ? (
				<VrPost post={currentPost} />
			) : (
				<VideoPost post={currentPost} swipe={swipeHandlers} />
			);
		// video element steals events needed for detecting swipe
		//needsSwipeListener = true;
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

	const details = (
		<Stack spacing={2}>
			<PostActions post={currentPost} vote={vote} favorite={favorite} />
			<TagsCard post={currentPost} />
			<DetailsCard post={currentPost} />
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
