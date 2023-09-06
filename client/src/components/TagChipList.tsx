/** @format */

import TagChip from "./TagChip";
import { useAppSelector } from "../features/Hooks";
import { selectTagState } from "../features/tags/TagSlice";
import { BooruTag, BooruTagCategory } from "../models/BooruTag";
import { Typography } from "@mui/material";

interface TagChipListProps {
	tags: string[];
	orderBy: "alphabetical" | "popularity";
}

const TagChipList = (props: TagChipListProps) => {
	const { tags, tagFrequencies, categories } = useAppSelector(selectTagState);

	const tagsInOrder = Object.keys(tagFrequencies).sort((a, b) => tagFrequencies[b] - tagFrequencies[a]);

	// which categories are used?
	const postCategories: { [name: string]: BooruTagCategory } = {};
	const categoryTags: { [name: string]: string[] } = {};
	const categorylessTags: string[] = [];

	props.tags.forEach(t => {
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
		if (tags.length == 0) {
			return <></>;
		}

		if (props.orderBy == "alphabetical") {
			tags.sort();
		} else if (props.orderBy == "popularity") {
			tags.sort((a, b) => tagFrequencies[b] - tagFrequencies[a]);
		}

		return (
			<div className="TagsCard-cat" key={"cat-tags-" + (cat?.id || "default")}>
				{<Typography variant="subtitle1">{cat?.displayMultiple || "Other"}</Typography>}
				{tags.map(t => (
					<TagChip key={"tc-" + t} tag={t} />
				))}
			</div>
		);
	};

	return (
		<>
			{Object.keys(categoryTags).map(cat => renderTagsList(categoryTags[cat], postCategories[cat]))}
			{renderTagsList(categorylessTags, null)}
		</>
	);
};

export default TagChipList;
