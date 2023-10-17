/** @format */
import React, { useEffect, useRef } from "react";
import { SwipeableHandlers } from "react-swipeable";

import { BooruPost } from "../../../models/BooruPost";
import { LogFactory } from "../../../util/Logger";
import { Util } from "../../../util/Util";

const logger = LogFactory.create("VideoPost");

export interface VideoPostProps {
	post: BooruPost;
	swipe: SwipeableHandlers;
}

const VideoPost = (props: VideoPostProps) => {
	const videoElem = useRef<HTMLVideoElement>(null);

	if (props.post.extension != "mp4" && props.post.extension != "webm") {
		return Util.logAndDisplayError(logger, `unsupported extension ${props.post.extension}`, props.post);
	}

	const handleClick: React.MouseEventHandler<HTMLDivElement> = e => {
		if (videoElem != null) {
			if (videoElem.current?.paused) {
				videoElem.current?.play();
			} else {
				videoElem.current?.pause();
			}
		}
	};

	useEffect(() => {
		videoElem.current?.load();
	}, [props.post]);

	return (
		<>
			{Util.isTouchDevice() ? (
				<div className="PostPage-listener" {...props.swipe} onClick={handleClick} />
			) : (
				<></>
			)}
			<div className="VideoPost">
				<video loop autoPlay controls ref={videoElem}>
					<source
						src={props.post.videoUrl}
						type={props.post.extension == "mp4" ? "video/mp4" : "video/webm"}
					/>
				</video>
			</div>
		</>
	);
};

export default VideoPost;
