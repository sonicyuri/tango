/** @format */

import DownloadIcon from "@mui/icons-material/Download";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import { Button, ButtonGroup } from "@mui/material";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../../../features/Hooks";
import {
	favoriteSet,
	selectFavoriteState
} from "../../../features/favorites/FavoriteSlice";
import {
	postDownload,
	postVote,
	selectPostState
} from "../../../features/posts/PostSlice";
import { BooruPost } from "../../../models/BooruPost";

interface PostActionsProps {
	post: BooruPost;
	vote: number;
	favorite: boolean;
}

const PostActions = (props: PostActionsProps) => {
	const dispatch = useAppDispatch();

	const { favorites } = useAppSelector(selectFavoriteState);
	const { votes } = useAppSelector(selectPostState);

	const handleDownload = () => {
		dispatch(postDownload(props.post));
	};

	const handleFavorite = () => {
		dispatch(
			favoriteSet({ postId: props.post.id, favorite: !props.favorite })
		);
	};

	const handleVote = (score: number) => {
		let action: "up" | "down" | "clear" =
			score == props.vote ? "clear" : score == -1 ? "down" : "up";
		dispatch(postVote({ post_id: props.post.id, action }));
	};

	return (
		<div className="PostActions-Container">
			<ButtonGroup className="PostActions">
				<Button
					className={
						props.vote == 1 ? "PostActionsButton--Active" : ""
					}
					title={
						props.vote == 1
							? "Remove Vote (W, ↑)"
							: "Upvote Post (W, ↑)"
					}
					onClick={() => handleVote(1)}>
					{!votes.ready() ? (
						<LoadingSpinner />
					) : props.vote == -1 ? (
						<ThumbUpOffAltIcon />
					) : (
						<ThumbUpAltIcon />
					)}
				</Button>
				<Button
					className={
						props.vote == -1 ? "PostActionsButton--Active" : ""
					}
					title={
						props.vote == -1
							? "Remove Vote (S, ↓)"
							: "Downvote Post (S, ↓)"
					}
					onClick={() => handleVote(-1)}>
					{!votes.ready() ? (
						<LoadingSpinner />
					) : props.vote == 1 ? (
						<ThumbDownOffAltIcon />
					) : (
						<ThumbDownAltIcon />
					)}
				</Button>
				<Button
					className={
						props.favorite ? "PostActionsButton--Active" : ""
					}
					title={props.favorite ? "Unfavorite (F)" : "Favorite (F)"}
					onClick={handleFavorite}>
					{!favorites.ready() ? (
						<LoadingSpinner />
					) : props.favorite ? (
						<StarIcon />
					) : (
						<StarBorderIcon />
					)}
				</Button>
				<Button title="Download" onClick={handleDownload}>
					<DownloadIcon />
				</Button>
			</ButtonGroup>
			<div className="PostActions-Stats">
				<div className="PostActions-Stat">
					<strong>
						{props.post.numericScore === 0
							? ""
							: props.post.numericScore > 0
								? "+"
								: "-"}
						{props.post.numericScore}
					</strong>{" "}
					score
				</div>
				<div className="PostActions-Stat">
					<strong>{props.post.views}</strong> views
				</div>
			</div>
		</div>
	);
};

export default PostActions;
