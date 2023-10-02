/** @format */
import styled from "@emotion/styled";
import { Autocomplete, Box, Chip, createFilterOptions, FilterOptionsState, TextField, Typography } from "@mui/material";
import React from "react";
import { matchSorter } from "match-sorter";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { selectTagFrequencies, selectTagState } from "../features/tags/TagSlice";
import { BooruTag } from "../models/BooruTag";
import { LogFactory } from "../util/Logger";
import { Util } from "../util/Util";

const logger = LogFactory.create("TagInput");

const UnpaddedFilledInput = styled(TextField)({
	"& .MuiFilledInput-root": {
		paddingTop: 0
	}
});

export interface TagInputProps {
	values: string[];
	onValuesChange: (tags: string[]) => void;
	onSubmit: () => void;
}

const TagInput = (props: TagInputProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const { tags, categories } = useAppSelector(selectTagState);
	const tagFrequencies = useAppSelector(selectTagFrequencies);

	const existingTags: { [tag: string]: boolean } = {};
	props.values.forEach(t => (existingTags[t] = true));

	const filterOptions = (options: string[], { inputValue }: FilterOptionsState<string>): string[] => {
		return matchSorter(options, inputValue.replace(/\s+/g, "_"));
	};

	return (
		<div
			className="TagInput"
			style={{
				flexGrow: 1
			}}>
			<Autocomplete
				multiple
				filterOptions={filterOptions}
				options={tags.filter(t => !existingTags[t.tag]).map(t => t.tag)}
				value={props.values}
				onChange={(_: any, values: readonly string[]) =>
					props.onValuesChange(values.map(v => v.trim().replace(/\s+/g, "_")))
				}
				freeSolo
				renderTags={(value: readonly string[], getTagProps) => {
					return value.map((tag: string, index: number) => (
						// eslint-disable-next-line react/jsx-key
						<Chip
							variant="outlined"
							label={Util.formatTag(tag)}
							{...getTagProps({
								index
							})}
						/>
					));
				}}
				renderInput={params => <UnpaddedFilledInput {...params} variant="filled" placeholder="Search" />}
				renderOption={(props, option) => {
					const category = BooruTag.getCategory(option, categories);

					return (
						<Box component="li" {...props}>
							<Typography variant="subtitle1" color={category?.color}>
								{Util.formatTag(option)}&nbsp;
							</Typography>
							<Typography variant="body2">{tagFrequencies[option]}</Typography>
						</Box>
					);
				}}
				onSubmit={props.onSubmit}
			/>
		</div>
	);
};

export default TagInput;
