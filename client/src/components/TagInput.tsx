/** @format */
import styled from "@emotion/styled";
import {
	Autocomplete,
	Box,
	Chip,
	createFilterOptions,
	FilterOptionsState,
	TextField,
	Typography
} from "@mui/material";
import React from "react";
import { matchSorter } from "match-sorter";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { selectTagState } from "../features/tags/TagSlice";
import { BooruTag } from "../models/BooruTag";
import { LogFactory } from "../util/Logger";
import { Util } from "../util/Util";

const logger = LogFactory.create("TagInput");
const DefaultMaxValuesToDisplay = 20;

const UnpaddedFilledInput = styled(TextField)({
	"& .MuiFilledInput-root": {
		paddingTop: 0
	}
});

export interface TagInputProps {
	values: string[];
	variant?: "search" | "edit";
	maxValuesToDisplay?: number;

	onValuesChange: (tags: string[]) => void;
	onSubmit: () => void;
}

const TagInput = (props: TagInputProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const maxValues = props.maxValuesToDisplay ?? DefaultMaxValuesToDisplay;

	const {
		tags: tagsAsync,
		categories,
		tagFrequencies: tagFrequenciesAsync
	} = useAppSelector(selectTagState);
	const tags = tagsAsync.value;
	const tagFrequencies = tagFrequenciesAsync.value;
	const tagsCopy = tags
		.slice()
		.map(t => new BooruTag(t.tag, tagFrequencies[t.tag] || 0))
		.sort((a, b) => b.frequency - a.frequency);

	const existingTags: { [tag: string]: boolean } = {};
	props.values.forEach(t => (existingTags[t] = true));

	const filterOptions = (
		options: string[],
		{ inputValue }: FilterOptionsState<string>
	): string[] => {
		const sanitizeInput = inputValue.trim().replace(/\s+/g, "_");

		const arr =
			inputValue.trim().length == 0
				? options
				: matchSorter(options, inputValue.replace(/\s+/g, "_"), {
						threshold: matchSorter.rankings.CONTAINS,
						sorter: items =>
							items.sort((a, b) => {
								let tagAFreq = tagFrequencies[a.item] || 0;
								let tagBFreq = tagFrequencies[b.item] || 0;

								const max = Math.max(tagAFreq, tagBFreq);
								tagAFreq /= max;
								tagBFreq /= max;

								const factor = Math.max(2, Math.log2(max));

								if (a.item == sanitizeInput) {
									return -1;
								} else if (
									a.item.startsWith(sanitizeInput) ||
									Util.stripTagCategory(a.item).startsWith(
										sanitizeInput
									)
								) {
									tagAFreq *= factor;
								} else {
									tagAFreq *=
										a.item.indexOf(sanitizeInput) != -1
											? 1
											: 0.5;
								}

								if (b.item == sanitizeInput) {
									return 1;
								} else if (
									b.item.startsWith(sanitizeInput) ||
									Util.stripTagCategory(b.item).startsWith(
										sanitizeInput
									)
								) {
									tagBFreq *= factor;
								} else {
									tagBFreq *=
										b.item.indexOf(sanitizeInput) != -1
											? 1
											: 0.5;
								}

								return tagBFreq - tagAFreq;
							})
					});
		return arr.length > maxValues ? arr.slice(0, maxValues) : arr;
	};

	const variant = props.variant ?? "search";

	return (
		<div
			className="TagInput"
			style={{
				flexGrow: 1
			}}>
			<Autocomplete
				multiple
				filterOptions={filterOptions}
				options={tagsCopy
					.filter(t => !existingTags[t.tag])
					.map(t => t.tag)}
				value={props.values}
				onChange={(_: any, values: readonly string[]) =>
					props.onValuesChange(
						values.map(v => v.trim().replace(/\s+/g, "_"))
					)
				}
				freeSolo
				disableClearable={variant == "edit"}
				renderTags={(value: readonly string[], getTagProps) => {
					return value.map((tag: string, index: number) => (
						// eslint-disable-next-line react/jsx-key
						<Chip
							variant="outlined"
							label={tag.replace(
								/_/g,
								"_" + String.fromCharCode(8203)
							)}
							{...getTagProps({
								index
							})}
						/>
					));
				}}
				renderInput={params => (
					<UnpaddedFilledInput
						{...params}
						variant={variant == "search" ? "filled" : "outlined"}
						placeholder="Search"
					/>
				)}
				renderOption={(props, option) => {
					const category = BooruTag.getCategory(
						option,
						categories.value
					);

					return (
						<Box component="li" {...props}>
							<Typography
								variant="subtitle1"
								color={category?.color}>
								{Util.formatTag(option)}&nbsp;
							</Typography>
							<Typography variant="body2">
								{tagFrequencies[option]}
							</Typography>
						</Box>
					);
				}}
				onSubmit={props.onSubmit}
			/>
		</div>
	);
};

export default TagInput;
