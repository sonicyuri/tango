/** @format */
import { Typography } from "@mui/material";

import { useAppSelector } from "../features/Hooks";
import { selectTagState } from "../features/tags/TagSlice";
import { BooruTag, BooruTagCategory } from "../models/BooruTag";
import TagChip from "./TagChip";

const LimitTagsCount = 200;

interface TagChipListProps {
	tags: string[];
	orderBy: "alphabetical" | "popularity";
	limitTags?: boolean;
}

const TagChipList = (props: TagChipListProps) => {
	const limitTags = props.limitTags || false;
	const { tags, tagFrequencies, categories } = useAppSelector(selectTagState);

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

	// filter out tags
	const ignoredTags: { [tag: string]: boolean } = {};
	const populateIgnoredTags = function (arr: string[]) {
		const tagsInOrder = arr.sort((a, b) => tagFrequencies[b] - tagFrequencies[a]);
		if (tagsInOrder.length > LimitTagsCount) {
			const tagsToIgnore = tagsInOrder.slice(LimitTagsCount);
			tagsToIgnore.forEach(t => (ignoredTags[t] = true));
		}
	};

	if (limitTags) {
		Object.keys(categoryTags).forEach(cat => populateIgnoredTags(categoryTags[cat]));
		populateIgnoredTags(categorylessTags);
	}

	const renderTagsList = function (tags: string[], cat: BooruTagCategory | null) {
		if (tags.length == 0) {
			return <></>;
		}

		const filteredTags = tags.filter(t => !ignoredTags[t]);
		if (props.orderBy == "alphabetical") {
			filteredTags.sort();
		} else if (props.orderBy == "popularity") {
			filteredTags.sort((a, b) => tagFrequencies[b] - tagFrequencies[a]);
		}

		return (
			<div className="TagsCard-cat" key={"cat-tags-" + (cat?.id || "default")}>
				{<Typography variant="subtitle1">{cat?.displayMultiple || "Other"}</Typography>}
				{filteredTags.map(t => (
					<TagChip key={"tc-" + t} tag={t} />
				))}
				{filteredTags.length == tags.length ? (
					<></>
				) : (
					<Typography variant="subtitle1">
						too many tags to show, {tags.length - filteredTags.length} tags hidden
					</Typography>
				)}
			</div>
		);
	};

	const categoriesSorted = Object.keys(categoryTags);
	categoriesSorted.sort();

	return (
		<>
			{categoriesSorted.map(cat => renderTagsList(categoryTags[cat], postCategories[cat]))}
			{renderTagsList(categorylessTags, null)}
		</>
	);
};

export default TagChipList;
