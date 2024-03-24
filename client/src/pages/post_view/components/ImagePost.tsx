/** @format */

import { useRouteError } from "react-router-dom";
import React from "react";
import { LogFactory } from "../../../util/Logger";
import { BooruPost } from "../../../models/BooruPost";
import { ContentCache } from "../../../features/ContentCache";
import { ContentLoader } from "../../../components/ContentLoader";

const logger = LogFactory.create("ImagePost");

export interface ImagePostProps {
	post: BooruPost;
}

const ImagePost = (props: ImagePostProps) => {
	return (
		<ContentLoader
			get={() => ContentCache.get(props.post)}
			post={props.post}
			className="ImagePost"
			render={dataUrl => (
				<div
					className="ImagePost"
					style={{
						backgroundImage: `url(${dataUrl})`
					}}
				/>
			)}
		/>
	);
};

export default ImagePost;
