/** @format */

import { useNavigate, useRouteError } from "react-router-dom";
import React, { useState } from "react";
import { LogFactory } from "../util/Logger";
import { BooruImage } from "../models/BooruImage";
import { Button, Card, CardActions, CardContent, CardHeader, Chip } from "@mui/material";
import TagInput from "./TagInput";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { imageList, imageSetTags } from "../features/images/ImageSlice";
import Spinner from "react-spinkit";
import { Util } from "../util/Util";
import { selectTagState, tagList } from "../features/tags/TagSlice";

const logger = LogFactory.create("TagsCard");

export interface TagsCardProps {
	image: BooruImage;
	onEditingChanged: (editing: boolean) => void;
}

const TagsCard = (props: TagsCardProps) =>
{
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(false);
	const [editing, setEditing] = useState(false);
	const [tempTags, setTempTags] = useState(props.image.tags);
	const { tags } = useAppSelector(selectTagState);

	const onClickTag = (ev: React.MouseEvent, tag: string) =>
	{
		ev.stopPropagation();
		ev.preventDefault();

		dispatch(imageList({
			query: tag,
			page: 1
		}));

		navigate(Util.makeImagesLink(tag, 1));
	}

	const showTags = (
		<div className="TagsCard">
			{props.image.tags.map(t =>
			{
				return <Chip component="a" key={t} label={t} onClick={(e: React.MouseEvent) => onClickTag(e, t)} clickable href={Util.makeImagesLink(t, 1)} />;
			})}
		</div>
	);

	const showTagsButtons = (
		<Button onClick={() => { setEditing(true); props.onEditingChanged(true); setTempTags(props.image.tags); }}>Edit Tags</Button>
	);

	const onSubmit = () =>
	{ 
		setLoading(true);

		dispatch(imageSetTags({
			image: props.image,
			tags: tempTags.join(" ")
		}))
			.unwrap()
			.then(() =>
			{
				// new tags! we gotta re-fetch the tags list
				if (tempTags.filter(t => tags.indexOf(t) == -1).length > 0)
				{
					dispatch(tagList(null));
				}
				
				setLoading(false);
				setEditing(false);
				props.onEditingChanged(false);
			});
	};

	const editTags = (
		<TagInput values={tempTags} onValuesChange={(values) => setTempTags(values)} onSubmit={onSubmit} />
	);

	const editTagsButtons = (
		<>
			<Button onClick={onSubmit} disabled={loading}>Save</Button>
			<Button onClick={() => { setEditing(false); props.onEditingChanged(false); }} disabled={loading}>Discard</Button>
		</>
	);

	return (
		<Card raised={true}>
			<CardHeader title="Tags" />
			<CardContent style={{ position: "relative" }}>
				<div className="Tags-loading" style={{ visibility: loading ? "visible" : "hidden" }}>
					<Spinner name="wave" fadeIn="none" color="white" />
				</div>
				{editing ? editTags : showTags}
			</CardContent>
			<CardActions>
				{editing ? editTagsButtons : showTagsButtons}
			</CardActions>
		</Card>
	);
};

export default TagsCard;
