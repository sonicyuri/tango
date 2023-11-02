/** @format */
import { Button, Card, CardContent, CardHeader, Link as MuiLink, Stack, Typography } from "@mui/material";

import LoadingSpinner from "../../../components/LoadingSpinner";
import { favoriteSet, selectFavoriteState } from "../../../features/favorites/FavoriteSlice";
import { useAppDispatch, useAppSelector } from "../../../features/Hooks";
import { postDownload } from "../../../features/posts/PostSlice";
import { BooruPost } from "../../../models/BooruPost";
import { LogFactory, Logger } from "../../../util/Logger";
import { Util } from "../../../util/Util";

const logger: Logger = LogFactory.create("DetailsCard");

export interface DetailsCardProps {
	post: BooruPost;
}

const DetailsCard = (props: DetailsCardProps) => {
	const dispatch = useAppDispatch();

	const { favorites, loadingState: favoriteState } = useAppSelector(selectFavoriteState);

	// set up detail rows
	const genericDetailRow = (body: string) => <Typography variant="body1">{body}</Typography>;

	const handleDownload = () => {
		dispatch(postDownload(props.post));
	};
	const downloadLink = (
		<MuiLink onClick={handleDownload} underline="none" style={{ cursor: "pointer" }}>
			Download File
		</MuiLink>
	);

	const isFavorite = favorites.indexOf(props.post.id) !== -1;

	const handleFavorite = () => {
		dispatch(favoriteSet({ postId: props.post.id, favorite: !isFavorite }));
	};

	const favoriteText = isFavorite ? "Unfavorite" : "Favorite";

	const favoriteButton = (
		<Button
			variant={isFavorite ? "outlined" : "contained"}
			onClick={handleFavorite}
			disabled={favoriteState != "ready"}>
			{favoriteState == "ready" ? favoriteText : <LoadingSpinner />}
		</Button>
	);

	const detailsRows: { title?: string; body: JSX.Element }[] = [
		{ body: favoriteButton },

		{ title: "Date posted", body: genericDetailRow(Util.formatDate(props.post.postedAt)) },
		{ title: "File size", body: genericDetailRow(Util.formatBytes(props.post.fileSize)) },
		{ title: "Score", body: genericDetailRow(props.post.numericScore.toString()) },
		{ body: downloadLink }
	];

	return (
		<Card raised={true} className="PostPage-details">
			<CardHeader title="Details" />
			<CardContent>
				<Stack spacing={2}>
					{detailsRows.map((d, k) => (
						<div className="PostPage-details-row" key={"row-" + k}>
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
	);
};

export default DetailsCard;
