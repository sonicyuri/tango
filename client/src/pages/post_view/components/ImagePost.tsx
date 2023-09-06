/** @format */

import { useRouteError } from "react-router-dom";
import React from "react";
import { LogFactory } from "../../../util/Logger";
import { BooruPost } from "../../../models/BooruPost";

const logger = LogFactory.create("ImagePost");

export interface ImagePostProps {
	post: BooruPost;
}

const ImagePost = (props: ImagePostProps) => {
	return <div className="ImagePost" style={{ backgroundImage: `url(${props.post.videoUrl})` }}></div>;
};

export default ImagePost;
