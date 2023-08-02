/** @format */

import { useRouteError } from "react-router-dom";
import React, { useEffect } from "react";
import { LogFactory } from "../util/Logger";
import { BooruImage } from "../models/BooruImage";

const logger = LogFactory.create("FlashPost");

export interface FlashPostProps {
	image: BooruImage;
}

const FlashPost = (props: FlashPostProps) => {
	useEffect(() => {
		(window as any)["RufflePlayer"].config = { wmode: "transparent" };
		const ruffle = (window as any)["RufflePlayer"].newest();
		const player = ruffle.createPlayer();
		const container = document.getElementById("RuffleContainer");
		container?.appendChild(player);
		player.load({
			url: props.image.videoUrl,
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
