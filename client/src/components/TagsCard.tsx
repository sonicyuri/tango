/** @format */
import { Button, Card, CardActions, CardContent, CardHeader, Chip } from "@mui/material";
import Color from "colorjs.io";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "react-spinkit";

import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { postSetTags } from "../features/posts/PostSlice";
import { selectTagState, tagList } from "../features/tags/TagSlice";
import { BooruPost } from "../models/BooruPost";
import { BooruTag } from "../models/BooruTag";
import { LogFactory } from "../util/Logger";
import { Util } from "../util/Util";
import TagInput from "./TagInput";

const logger = LogFactory.create("TagsCard");

export interface TagsCardProps {
	post: BooruPost;
	onEditingChanged: (editing: boolean) => void;
}

const TagsCard = (props: TagsCardProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(false);
	const [editing, setEditing] = useState(false);
	const [tempTags, setTempTags] = useState(props.post.tags);
	const { tags, categories } = useAppSelector(selectTagState);

	const onClickTag = (ev: React.MouseEvent, tag: string) => {
		ev.preventDefault();

		navigate(Util.makePostsLink(tag, 1));
	};

	const showTags = (
		<div className="TagsCard">
			{props.post.tags.map(t => {
				const category = BooruTag.getCategory(t, categories);
				const color = category?.color || "default";
				const hoverColor: string = new Color(new Color(category?.color || "#000000").lighten(0.15)).toString({
					format: "hex"
				});
				const style =
					category != null ? { backgroundColor: color, ":hover": { backgroundColor: hoverColor } } : {};
				return (
					<Chip
						component="a"
						key={t}
						label={t}
						sx={style}
						onClick={(e: React.MouseEvent) => onClickTag(e, t)}
						clickable
						href={Util.makePostsLink(t, 1)}
					/>
				);
			})}
		</div>
	);

	const showTagsButtons = (
		<Button
			onClick={() => {
				setEditing(true);
				props.onEditingChanged(true);
				setTempTags(props.post.tags);
			}}>
			Edit Tags
		</Button>
	);

	const onSubmit = () => {
		setLoading(true);

		dispatch(
			postSetTags({
				post: props.post,
				tags: tempTags.join(" ")
			})
		)
			.unwrap()
			.then(() => {
				// new tags! we gotta re-fetch the tags list
				if (tempTags.filter(t => tags.find(t2 => t2.tag == t) === undefined).length > 0) {
					dispatch(tagList(null));
				}

				setLoading(false);
				setEditing(false);
				props.onEditingChanged(false);
			});
	};

	const editTags = <TagInput values={tempTags} onValuesChange={values => setTempTags(values)} onSubmit={onSubmit} />;

	const editTagsButtons = (
		<>
			<Button onClick={onSubmit} disabled={loading}>
				Save
			</Button>
			<Button
				onClick={() => {
					setEditing(false);
					props.onEditingChanged(false);
				}}
				disabled={loading}>
				Discard
			</Button>
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
			<CardActions>{editing ? editTagsButtons : showTagsButtons}</CardActions>
		</Card>
	);
};

export default TagsCard;
