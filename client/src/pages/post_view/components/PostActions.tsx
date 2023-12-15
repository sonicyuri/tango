/** @format */

import { Button, ButtonGroup } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";

const PostActions = () => {
	let vote: 0 | 1 | -1 = 0;

	return (
		<ButtonGroup>
			<Button>
				<EditIcon />
				{vote == -1 ? <ThumbUpOffAltIcon /> : <ThumbUpAltIcon />}
				{vote == 1 ? <ThumbDownOffAltIcon /> : <ThumbDownAltIcon />}
			</Button>
		</ButtonGroup>
	);
};

export default PostActions;
