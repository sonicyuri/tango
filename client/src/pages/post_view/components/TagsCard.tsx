/** @format */
import { Button, Card, CardActions, CardContent, CardHeader, Chip, Typography } from "@mui/material";
import Color from "colorjs.io";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "react-spinkit";

import { useAppDispatch, useAppSelector } from "../../../features/Hooks";
import { postSetTags } from "../../../features/posts/PostSlice";
import { selectTagState, tagList } from "../../../features/tags/TagSlice";
import { BooruPost } from "../../../models/BooruPost";
import { BooruTag, BooruTagCategory } from "../../../models/BooruTag";
import { LogFactory } from "../../../util/Logger";
import { Util } from "../../../util/Util";
import TagInput from "../../../components/TagInput";
import TagChip from "../../../components/TagChip";
import TagChipList from "../../../components/TagChipList";

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

	const { tags } = useAppSelector(selectTagState);

	useEffect(() => {
		setEditing(false);
		props.onEditingChanged(false);
	}, [props.post]);

	const showTags = (
		<div className="TagsCard">
			<TagChipList tags={props.post.tags} orderBy="alphabetical" />
		</div>
	);

	const showTagsButtons = (
		<Button
			variant="contained"
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
			<Button variant="contained" onClick={onSubmit} disabled={loading}>
				Save
			</Button>
			<Button
				variant="outlined"
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
			<CardHeader title="Tags" style={{ paddingBottom: 0 }} />
			<CardContent style={{ position: "relative", paddingTop: 0, paddingBottom: 0 }}>
				<div className="Tags-loading" style={{ visibility: loading ? "visible" : "hidden" }}>
					<Spinner name="wave" fadeIn="none" color="white" />
				</div>
				{editing ? editTags : showTags}
			</CardContent>
			<CardActions style={{ padding: "16px" }}>{editing ? editTagsButtons : showTagsButtons}</CardActions>
		</Card>
	);
};

export default TagsCard;
