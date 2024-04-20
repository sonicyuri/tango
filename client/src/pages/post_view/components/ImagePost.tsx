/** @format */

import { BooruPost } from "../../../models/BooruPost";
import { LogFactory } from "../../../util/Logger";

const logger = LogFactory.create("ImagePost");

export interface ImagePostProps {
	post: BooruPost;
}

const ImagePost = (props: ImagePostProps) => {
	return (
		<div
			className="ImagePost"
			style={{ backgroundImage: `url(${props.post.contentUrl})` }}></div>
	);
};

export default ImagePost;
