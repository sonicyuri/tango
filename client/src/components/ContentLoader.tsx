/** @format */

import { useEffect, useState } from "react";
import { ContentCacheResult } from "../features/ContentCache";
import { CircularProgress } from "@mui/material";
import { BooruPost } from "../models/BooruPost";

export interface ContentLoaderProps {
	get: () => ContentCacheResult;
	post: BooruPost;
	render: (dataUrl: string) => React.ReactNode;
	className?: string;
}

export const ContentLoader = (props: ContentLoaderProps) => {
	const [result, setResult] = useState<ContentCacheResult>({
		status: "loading",
		progress: 0
	});

	useEffect(() => {
		const val = props.get();
		if (val.status === "loading") {
			let interval = 0;
			interval = setInterval(() => {
				const res = props.get();
				if (res.status === "completed") {
					clearInterval(interval);
				}
				setResult(res);
			}, 250);

			return () => {
				clearInterval(interval);
			};
		}

		setResult(val);
	}, [props.post]);

	if (result.status === "loading") {
		return (
			<div
				className={"ContentLoader " + (props.className ?? "")}
				style={{
					width: props.post.imageSize[0],
					height: props.post.imageSize[1]
				}}>
				<CircularProgress
					size={60}
					variant={"determinate"}
					value={result.progress * 100}
				/>
			</div>
		);
	} else {
		return props.render(result.entry.contentDataUrl);
	}
};
