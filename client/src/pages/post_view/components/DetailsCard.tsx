/** @format */
import { Button, Card, CardContent, CardHeader, Link as MuiLink, Stack, Typography } from "@mui/material";
import Spinner from "react-spinkit";

import { favoriteSet, selectFavoriteState } from "../../../features/favorites/FavoriteSlice";
import { useAppDispatch, useAppSelector } from "../../../features/Hooks";
import { LogFactory, Logger } from "../../../util/Logger";
import { Util } from "../../../util/Util";
import { BooruPost } from "../../../models/BooruPost";

const logger: Logger = LogFactory.create("DetailsCard");

export interface DetailsCardProps {
	post: BooruPost;
}

const DetailsCard = (props: DetailsCardProps) => {
	const dispatch = useAppDispatch();

	const { favorites, loadingState: favoriteState } = useAppSelector(selectFavoriteState);

	// set up detail rows
	const genericDetailRow = (body: string) => <Typography variant="body1">{body}</Typography>;

	// TODO: fix downloads (actually download, don't redirect)
	const downloadLink = (
		<MuiLink href={props.post.videoUrl} download={props.post.hash + "." + props.post.extension} underline="none">
			Download File
		</MuiLink>
	);

	const isFavorite = favorites.indexOf(props.post.id) !== -1;

	const handleFavorite = () => {
		dispatch(favoriteSet({ postId: props.post.id, favorite: !isFavorite }));
	};

	const favoriteButton = (
		<Button
			variant={isFavorite ? "outlined" : "contained"}
			onClick={handleFavorite}
			disabled={favoriteState != "ready"}>
			{favoriteState == "ready" ? (
				isFavorite ? (
					"Unfavorite"
				) : (
					"Favorite"
				)
			) : (
				<Spinner name="wave" fadeIn="none" color="white" />
			)}
		</Button>
	);

	const detailsRows: { title?: string; body: JSX.Element }[] = [
		{ body: favoriteButton },
		{ title: "Date posted", body: genericDetailRow(Util.formatDate(props.post.postedAt)) },
		{ title: "File size", body: genericDetailRow(Util.formatBytes(props.post.fileSize)) },
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
