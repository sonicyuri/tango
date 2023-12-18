/** @format */
import { Button, Card, CardActions, CardContent, CardHeader } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../../../components/LoadingOverlay";

import LoadingSpinner from "../../../components/LoadingSpinner";
import TagChipList from "../../../components/TagChipList";
import TagInput from "../../../components/TagInput";
import { useAppDispatch, useAppSelector } from "../../../features/Hooks";
import { postSetTags, selectPostState } from "../../../features/posts/PostSlice";
import { selectTagState, tagList } from "../../../features/tags/TagSlice";
import { BooruPost } from "../../../models/BooruPost";
import { LogFactory } from "../../../util/Logger";
import ImportButton from "./ImportButton";
import PostActions from "./PostActions";

const logger = LogFactory.create("TagsCard");

export interface TagsCardProps {
	post: BooruPost;
}

const TagsCard = (props: TagsCardProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(false);
	const [editing, setEditing] = useState(false);
	const [tempTags, setTempTags] = useState(props.post.tags.sort());
	const isImporting = useRef(false);

	const { tags } = useAppSelector(selectTagState);

	const updateEditingState = (state: boolean) => {
		setEditing(state);
	};

	useEffect(() => {
		updateEditingState(false);
	}, [props.post]);

	const showTags = (
		<div className="TagsCard-tags">
			<TagChipList tags={props.post.tags} orderBy="alphabetical" />
		</div>
	);

	const showTagsButtons = (
		<>
			<Button
				variant="outlined"
				onClick={() => {
					updateEditingState(true);
					setTempTags(props.post.tags);
				}}>
				Edit
			</Button>
			<ImportButton
				post={props.post}
				onChange={visible => {
					isImporting.current = visible;
					updateEditingState(editing);
				}}
			/>
		</>
	);

	const onSubmit = () => {
		setLoading(true);

		dispatch(
			postSetTags({
				post: props.post,
				tags: tempTags
			})
		)
			.unwrap()
			.then(() => {
				// new tags! we gotta re-fetch the tags list
				if (tempTags.filter(t => tags.find(t2 => t2.tag == t) === undefined).length > 0) {
					dispatch(tagList(null));
				}

				setLoading(false);
				updateEditingState(false);
			});
	};

	const editTags = (
		<TagInput values={tempTags} variant="edit" onValuesChange={values => setTempTags(values)} onSubmit={onSubmit} />
	);

	const editTagsButtons = (
		<>
			<Button variant="outlined" onClick={onSubmit} disabled={loading}>
				Save
			</Button>
			<Button
				variant="outlined"
				onClick={() => {
					updateEditingState(false);
				}}
				disabled={loading}>
				Discard
			</Button>
		</>
	);

	return (
		<Card raised={true} className="PostsCard TagsCard">
			<div className="PostsCard-header">
				<CardHeader title="Tags" />
				<CardActions>{editing ? editTagsButtons : showTagsButtons}</CardActions>
			</div>
			<CardContent style={{ position: "relative" }}>
				<LoadingOverlay isLoading={loading} />
				{editing ? editTags : showTags}
			</CardContent>
		</Card>
	);
};

export default TagsCard;
