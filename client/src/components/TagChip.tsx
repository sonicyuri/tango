/** @format */
import { Chip, Typography } from "@mui/material";
import Color from "colorjs.io";
import { Link } from "react-router-dom";

import { useAppSelector } from "../features/Hooks";
import { selectTagFrequencies, selectTagState } from "../features/tags/TagSlice";
import { BooruTag } from "../models/BooruTag";
import { Util } from "../util/Util";

interface TagChipProps {
	tag: string;
	hyphensToSpaces?: boolean;
}

const TagChip = (props: TagChipProps) => {
	const hyphensToSpaces = props.hyphensToSpaces === undefined ? true : props.hyphensToSpaces;
	const t = props.tag;

	const { categories, tagFrequencies } = useAppSelector(selectTagState);

	const cat = BooruTag.getCategory(t, categories);

	const color = cat?.color || "default";
	const hoverColor: string = new Color(new Color(cat?.color || "#000000").lighten(0.15)).toString({
		format: "hex"
	});

	const style = cat != null ? { backgroundColor: color, ":hover": { backgroundColor: hoverColor } } : {};
	Object.assign(style, { marginRight: "5px", marginBottom: "5px", ":last-child": { marginRight: 0 } });

	const tagParts = t.split(":");
	const tagText = cat && tagParts.length > 1 ? tagParts[1] : t;
	const tagWithoutCategory = (
		<div style={{ display: "flex", alignItems: "center" }}>
			<Typography variant="body2">
				{hyphensToSpaces ? Util.formatTag(tagText) : tagText.replace(/_/g, "_&#8203;")}
			</Typography>
			<Typography variant="subtitle2" style={{ paddingLeft: "5px" }}>
				{tagFrequencies.all[t]}
			</Typography>
		</div>
	);

	return (
		<Chip component={Link} key={t} label={tagWithoutCategory} sx={style} clickable to={Util.makePostsLink(t, 1)} />
	);
};

export default TagChip;
