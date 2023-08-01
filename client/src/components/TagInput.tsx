/** @format */

import React from "react";
import { useNavigate } from "react-router-dom";
import { LogFactory } from "../util/Logger";
import { Autocomplete, Chip, TextField, styled } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { selectTagState } from "../features/tags/TagSlice";

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

	const { tags } = useAppSelector(selectTagState);

	return (
		<div
			className="tag-input"
			style={{
				flexGrow: 1
			}}>
			<Autocomplete
				multiple
				options={tags}
				value={props.values}
				onChange={(e, values) => props.onValuesChange(values)}
				freeSolo
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
				onSubmit={props.onSubmit}
			/>
		</div>
	);
};

export default TagInput;
