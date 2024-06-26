/** @format */
import {
	Card,
	CardContent,
	CardHeader,
	Stack,
	Typography
} from "@mui/material";

import { BooruPost } from "../../../models/BooruPost";
import { LogFactory, Logger } from "../../../util/Logger";
import { Util } from "../../../util/Util";

const logger: Logger = LogFactory.create("DetailsCard");

export interface DetailsCardProps {
	post: BooruPost;
}

const DetailsCard = (props: DetailsCardProps) => {
	// set up detail rows
	const genericDetailRow = (body: string) => (
		<Typography variant="body1">{body}</Typography>
	);

	const detailsRows: { title?: string; body: JSX.Element }[] = [
		{
			title: "Date posted",
			body: genericDetailRow(Util.formatDate(props.post.postedAt))
		},
		{
			title: "File size",
			body: genericDetailRow(Util.formatBytes(props.post.fileSize))
		},
		{
			title: "Score",
			body: genericDetailRow(props.post.numericScore.toString())
		}
	];

	return (
		<Card raised={true} className="PostsCard DetailsCard">
			<div className="PostsCard-header">
				<CardHeader title="Details" />
			</div>
			<CardContent>
				<Stack spacing={2} className="DetailsCard-rows">
					{detailsRows.map((d, k) => (
						<div className="DetailsCard-row" key={"row-" + k}>
							{d.title ? (
								<Typography
									variant="subtitle2"
									key={"title-" + d.title}>
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
