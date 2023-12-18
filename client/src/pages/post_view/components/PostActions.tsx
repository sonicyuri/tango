/** @format */

import { Button, ButtonGroup } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import DownloadIcon from "@mui/icons-material/Download";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import { BooruPost } from "../../../models/BooruPost";
import { useAppDispatch, useAppSelector } from "../../../features/Hooks";
import { postDownload, postVote, selectPostState } from "../../../features/posts/PostSlice";
import { favoriteSet, selectFavoriteState } from "../../../features/favorites/FavoriteSlice";
import LoadingSpinner from "../../../components/LoadingSpinner";

interface PostActionsProps {
	post: BooruPost;
	vote: number;
	favorite: boolean;
}

const PostActions = (props: PostActionsProps) => {
	const dispatch = useAppDispatch();

	const { loadingState: favoriteLoading } = useAppSelector(selectFavoriteState);
	const { voteState: voteLoading } = useAppSelector(selectPostState);

	const handleDownload = () => {
		dispatch(postDownload(props.post));
	};

	const handleFavorite = () => {
		dispatch(favoriteSet({ postId: props.post.id, favorite: !props.favorite }));
	};

	const handleVote = (score: number) => {
		let action: "up" | "down" | "clear" = score == props.vote ? "clear" : score == -1 ? "down" : "up";
		dispatch(postVote({ post_id: props.post.id, action }));
	};

	return (
		<ButtonGroup className="PostActions">
			<Button
				className={props.vote == 1 ? "PostActionsButton--Active" : ""}
				title={props.vote == 1 ? "Remove Vote" : "Upvote Post"}
				onClick={() => handleVote(1)}>
				{voteLoading == "loading" ? (
					<LoadingSpinner />
				) : props.vote == -1 ? (
					<ThumbUpOffAltIcon />
				) : (
					<ThumbUpAltIcon />
				)}
			</Button>
			<Button
				className={props.vote == -1 ? "PostActionsButton--Active" : ""}
				title={props.vote == -1 ? "Remote Vote" : "Downvote Post"}
				onClick={() => handleVote(-1)}>
				{voteLoading == "loading" ? (
					<LoadingSpinner />
				) : props.vote == 1 ? (
					<ThumbDownOffAltIcon />
				) : (
					<ThumbDownAltIcon />
				)}
			</Button>
			<Button
				className={props.favorite ? "PostActionsButton--Active" : ""}
				title={props.favorite ? "Unfavorite" : "Favorite"}
				onClick={handleFavorite}>
				{favoriteLoading == "loading" ? <LoadingSpinner /> : props.favorite ? <StarIcon /> : <StarBorderIcon />}
			</Button>
			<Button title="Download" onClick={handleDownload}>
				<DownloadIcon />
			</Button>
		</ButtonGroup>
	);
};

export default PostActions;
