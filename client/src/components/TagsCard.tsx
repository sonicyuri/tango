/** @format */
import { Button, Card, CardActions, CardContent, CardHeader, Chip, Typography } from "@mui/material";
import Color from "colorjs.io";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "react-spinkit";

import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { postSetTags } from "../features/posts/PostSlice";
import { selectTagState, tagList } from "../features/tags/TagSlice";
import { BooruPost } from "../models/BooruPost";
import { BooruTag, BooruTagCategory } from "../models/BooruTag";
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

	// which categories are used by this post?
	const postCategories: { [name: string]: BooruTagCategory } = {};
	const categoryTags: { [name: string]: string[] } = {};
	const categorylessTags: string[] = [];

	props.post.tags.forEach(t => {
		const cat = BooruTag.getCategory(t, categories);
		if (cat != null) {
			postCategories[cat.id] = cat;
			categoryTags[cat.id] = categoryTags[cat.id] || [];
			categoryTags[cat.id].push(t);
		} else {
			categorylessTags.push(t);
		}
	});

	const renderTagsList = function (tags: string[], cat: BooruTagCategory | null) {
		const color = cat?.color || "default";
		const hoverColor: string = new Color(new Color(cat?.color || "#000000").lighten(0.15)).toString({
			format: "hex"
		});
		const style = cat != null ? { backgroundColor: color, ":hover": { backgroundColor: hoverColor } } : {};

		return (
			<div className="TagsCard-cat">
				{<Typography variant="subtitle1">{cat?.displayMultiple || "Other"}</Typography>}
				{tags.map(t => {
					const tagParts = t.split(":");
					const tagWithoutCategory = tagParts.length > 1 ? tagParts[1] : t;
					return (
						<Chip
							component="a"
							key={t}
							label={tagWithoutCategory}
							sx={style}
							onClick={(e: React.MouseEvent) => onClickTag(e, t)}
							clickable
							href={Util.makePostsLink(t, 1)}
						/>
					);
				})}
			</div>
		);
	};

	const showTags = (
		<div className="TagsCard">
			{Object.keys(categoryTags).map(cat => renderTagsList(categoryTags[cat], postCategories[cat]))}
			{renderTagsList(categorylessTags, null)}
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
