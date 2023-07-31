/** @format */

import { useRouteError } from "react-router-dom";
import React from "react";
import { LogFactory } from "../util/Logger";
import { BooruImage } from "../models/BooruImage";

const logger = LogFactory.create("ImagePost");

export interface ImagePostProps {
	image: BooruImage;
}

const ImagePost = (props: ImagePostProps) => {
	return <img src={props.image.videoUrl} alt={"Image " + props.image.hash} />;
};

export default ImagePost;
