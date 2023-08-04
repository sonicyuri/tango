/** @format */
import { Autocomplete, Box, Chip, styled, TextField, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { selectTagState } from "../features/tags/TagSlice";
import { BooruTag } from "../models/BooruTag";
import { LogFactory } from "../util/Logger";

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

	const { tags, tagFrequencies, categories } = useAppSelector(selectTagState);

	return (
		<div
			className="TagInput"
			style={{
				flexGrow: 1
			}}>
			<Autocomplete
				multiple
				options={tags.map(t => t.tag)}
				value={props.values}
				onChange={(e, values) => props.onValuesChange(values)}
				freeSolo
				autoHighlight
				renderTags={(value: readonly string[], getTagProps) => {
					return value.map((tag: string, index: number) => (
						// eslint-disable-next-line react/jsx-key
						<Chip
							variant="outlined"
							label={tag}
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
								{option}&nbsp;
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
