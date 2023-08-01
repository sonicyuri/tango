/** @format */

import { useRouteError } from "react-router-dom";
import React from "react";
import { LogFactory } from "../util/Logger";
import { BooruImage } from "../models/BooruImage";

const logger = LogFactory.create("FlashPost");

export interface FlashPostProps {
	image: BooruImage;
}

const FlashPost = (props: FlashPostProps) => {
	return <p>flash post {props.image.hash}</p>;
};

export default FlashPost;
