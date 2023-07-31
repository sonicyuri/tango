/** @format */

import { useRouteError } from "react-router-dom";
import React from "react";
import { LogFactory } from "../util/Logger";
import { BooruImage } from "../models/BooruImage";

const logger = LogFactory.create("VideoPost");

export interface VideoPostProps {
	image: BooruImage;
}

const VideoPost = (props: VideoPostProps) => {
	if (props.image.extension != "mp4" && props.image.extension != "webm") 
	{
		return <p>unsupported extension {props.image.extension}</p>;
	}

	return (
		<video loop autoPlay controls>
			<source src={props.image.videoUrl} type={props.image.extension == "mp4" ? "video/mp4" : "video/webm"} />
		</video>
	);
};

export default VideoPost;
