/** @format */
import React, { useEffect } from "react";

import { BooruPost } from "../models/BooruPost";
import { LogFactory } from "../util/Logger";

const logger = LogFactory.create("FlashPost");

export interface FlashPostProps {
	post: BooruPost;
}

const FlashPost = (props: FlashPostProps) => {
	useEffect(() => {
		(window as any)["RufflePlayer"].config = { wmode: "transparent" };
		const ruffle = (window as any)["RufflePlayer"].newest();
		const player = ruffle.createPlayer();
		const container = document.getElementById("RuffleContainer");
		container?.appendChild(player);
		player.load({
			url: props.post.videoUrl,
			config: { wmode: "transparent" }
		});

		player.style.width = "100%";
		player.style.height = "90vh";

		return () => {
			container?.removeChild(player);
		};
	}, []);

	return (
		<>
			<div className="FlashPost" style={{ width: "100%" }}>
				<div className="FlashPost-container" id="RuffleContainer" style={{ width: "100%" }} />
			</div>
		</>
	);
};

export default FlashPost;
