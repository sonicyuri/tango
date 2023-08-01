/** @format */

import { useRouteError } from "react-router-dom";
import React, { useRef } from "react";
import { LogFactory } from "../util/Logger";
import { BooruImage } from "../models/BooruImage";
import { Util } from "../util/Util";
import { SwipeableHandlers } from "react-swipeable";

const logger = LogFactory.create("VideoPost");

export interface VideoPostProps {
	image: BooruImage;
	swipe: SwipeableHandlers
}

const VideoPost = (props: VideoPostProps) =>
{
	const videoElem = useRef<HTMLVideoElement>(null);

	if (props.image.extension != "mp4" && props.image.extension != "webm") 
	{
		return Util.logAndDisplayError(logger, "unsupported extension {props.image.extension}", props.image);
	}

	const handleClick : React.MouseEventHandler<HTMLDivElement> = (e) =>
	{
		if (videoElem != null)
		{
			if (videoElem.current?.paused)
			{
				videoElem.current?.play();
			}
			else
			{
				videoElem.current?.pause();
			}
		}	
	};

	return (
		<>
			{Util.isTouchDevice() ? <div className="ImagePage-listener" {...props.swipe} onClick={handleClick} /> : <></>}
			<div className="VideoPost">
				<video loop autoPlay controls ref={videoElem}>
					<source src={props.image.videoUrl} type={props.image.extension == "mp4" ? "video/mp4" : "video/webm"} />
				</video>
			</div>
		</>
	);
};

export default VideoPost;
