/** @format */

import { Button, ButtonGroup } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";

interface PostActionsProps {
	vote: 0 | 1 | -1;
}

const PostActions = (props: PostActionsProps) => {
	return (
		<ButtonGroup>
			<Button>
				<EditIcon />
				{props.vote == -1 ? <ThumbUpOffAltIcon /> : <ThumbUpAltIcon />}
				{props.vote == 1 ? <ThumbDownOffAltIcon /> : <ThumbDownAltIcon />}
			</Button>
		</ButtonGroup>
	);
};

export default PostActions;
