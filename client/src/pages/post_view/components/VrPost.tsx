/** @format */
import React, { useEffect, useRef } from "react";
import { SwipeableHandlers } from "react-swipeable";

import { BooruPost } from "../../../models/BooruPost";
import { LogFactory } from "../../../util/Logger";
import { Util } from "../../../util/Util";
import videojs from "video.js";
import videojsVr from "videojs-vr";

const logger = LogFactory.create("VrPost");

export interface VrPostProps {
	post: BooruPost;
}

const VrPost = (props: VrPostProps) => {
	const videoElem = useRef<HTMLVideoElement>(null);

	if (props.post.extension != "mp4" && props.post.extension != "webm") {
		return Util.logAndDisplayError(logger, `unsupported extension ${props.post.extension}`, props.post);
	}

	const getProjection = () => {
		if (props.post.tags.indexOf("vr:180") != -1) {
			return props.post.tags.indexOf("vr:sbs") == -1 ? "180" : "180_LR";
		} else if (props.post.tags.indexOf("vr:360") != -1) {
			return props.post.tags.indexOf("vr:sbs") == -1
				? props.post.tags.indexOf("vr:tb") == -1
					? "360"
					: "360_TB"
				: "360_LR";
		}
		return "AUTO";
	};

	useEffect(() => {
		const player = videojs(videoElem.current || "vr-video");
		const playerAny: any = player as any;
		playerAny.vr({ projection: "AUTO" });
		playerAny.mediainfo = playerAny.mediainfo || {};
		playerAny.mediainfo.projection = getProjection();
		(window as any).vrPlayer = playerAny;
	}, [videoElem]);

	useEffect(() => {
		let playerAny = (window as any).vrPlayer;
		if (playerAny == null) {
			return;
		}
		playerAny.mediainfo = playerAny.mediainfo || {};
		playerAny.mediainfo.projection = getProjection();
	}, [props.post]);

	return (
		<>
			<div className="VrPost">
				<video loop autoPlay controls ref={videoElem} id="vr-video">
					<source
						src={props.post.videoUrl}
						type={props.post.extension == "mp4" ? "video/mp4" : "video/webm"}
					/>
				</video>
			</div>
		</>
	);
};

export default VrPost;
