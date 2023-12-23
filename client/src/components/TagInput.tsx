/** @format */
import styled from "@emotion/styled";
import { Autocomplete, autocompleteClasses, Box, Chip, createFilterOptions, FilterOptionsState, IconButton, Popover, Popper, TextField, Typography } from "@mui/material";
import React, { useMemo, useState } from "react";
import { matchSorter } from "match-sorter";
import { useNavigate } from "react-router-dom";
import { VariableSizeList, ListChildComponentProps } from "react-window";
import TuneIcon from '@mui/icons-material/Tune';

import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { selectTagState } from "../features/tags/TagSlice";
import { BooruTag, BooruTagCategory } from "../models/BooruTag";
import { LogFactory } from "../util/Logger";
import { Util } from "../util/Util"; 

const logger = LogFactory.create("TagInput");
const enableOptions = false;

const UnpaddedFilledInput = styled(TextField)({
	"& .MuiFilledInput-root": {
		paddingTop: 0
	}
});

const LISTBOX_PADDING = 8;

function renderRow(categories: BooruTagCategory[], tagFrequencies: { [tag: string]: number })
{
	return (props: ListChildComponentProps) => {
		const { data, index, style } = props;
		const dataSet = data[index];
		const tag = dataSet[1];
		const category = useMemo(() => BooruTag.getCategory(tag, categories), [tag]);
		const formattedTag = useMemo(() => Util.formatTag(tag), [tag]);

		const inlineStyle = {
			...style,
			top: (style.top as number) + LISTBOX_PADDING,
		};
  
		return (
			<Box component="li" {...dataSet[0]} style={inlineStyle}>
				<Typography variant="subtitle1" color={category?.color}>
					{formattedTag}&nbsp;
				</Typography>
				<Typography variant="body2">{tagFrequencies[tag]}</Typography>
			</Box>
		);
	}
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef<HTMLDivElement>((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data: any) {
	const ref = React.useRef<VariableSizeList>(null);
	React.useEffect(() => {
	  if (ref.current != null) {
		ref.current.resetAfterIndex(0, true);
	  }
	}, [data]);
	return ref;
  }

const ListboxComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement>>(function ListBoxComponent(props, ref)
{
	const { children, ...other } = props;
	const { categories, tagFrequencies } = useAppSelector(selectTagState);

	const itemData: React.ReactElement[] = [];
	(children as React.ReactElement[]).forEach(
		(item: React.ReactElement & { children?: React.ReactElement[] }) => {
		  itemData.push(item);
		  itemData.push(...(item.children || []));
		},
	);

	const itemSize = 36;
	const height = itemData.length * itemSize;

	const gridRef = useResetCache(itemData.length);

	return (
		<div ref={ref}>
			<OuterElementContext.Provider value={other}>
				<VariableSizeList
					itemData={itemData}
					height={height + 2 * LISTBOX_PADDING}
					width="100%"
					ref={gridRef}
					outerElementType={OuterElementType}
					innerElementType="ul"
					itemSize={(index: number) => itemSize}
					overscanCount={100}
					itemCount={itemData.length}>
					{renderRow(categories, tagFrequencies)}
				</VariableSizeList>
			</OuterElementContext.Provider>
		</div>
	)
});

const StyledPopper = styled(Popper)({
	[`& .${autocompleteClasses.listbox}`]: {
	  boxSizing: 'border-box',
	  '& ul': {
		padding: 0,
		margin: 0,
	  },
	},
  });

export interface TagInputProps {
	values: string[];
	variant?: "search" | "edit";

	onValuesChange: (tags: string[]) => void;
	onSubmit: () => void;
}

const TagInput = (props: TagInputProps) => {
	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

	const { tags, categories, tagFrequencies } = useAppSelector(selectTagState);

	const existingTags: { [tag: string]: boolean } = {};
	props.values.forEach(t => (existingTags[t] = true));

	const options = useMemo(() => tags
		.slice()
		.map(t => new BooruTag(t.tag, tagFrequencies[t.tag] || 0))
		.sort((a, b) => b.frequency - a.frequency)
		.filter(t => !existingTags[t.tag])
		.map(t => t.tag), [tags])

	const filterOptions = (options: string[], { inputValue }: FilterOptionsState<string>): string[] => {
		const sanitizeInput = inputValue.trim().replace(/\s+/g, "_");

		return inputValue.trim().length == 0
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
								Util.stripTagCategory(a.item).startsWith(sanitizeInput)
							) {
								tagAFreq *= factor;
							} else {
								tagAFreq *= a.item.indexOf(sanitizeInput) != -1 ? 1 : 0.5;
							}

							if (b.item == sanitizeInput) {
								return 1;
							} else if (
								b.item.startsWith(sanitizeInput) ||
								Util.stripTagCategory(b.item).startsWith(sanitizeInput)
							) {
								tagBFreq *= factor;
							} else {
								tagBFreq *= b.item.indexOf(sanitizeInput) != -1 ? 1 : 0.5;
							}

							return tagBFreq - tagAFreq;
						})
			  });
	};

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);

	const optionsMenu =	(
		<>
			<Popover
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
				transformOrigin={{ vertical: "top", horizontal: "left" }}>
				
			</Popover>
		</>
	);

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
				options={options}
				value={props.values}
				onChange={(_: any, values: readonly string[]) =>
					props.onValuesChange(values.map(v => v.trim().replace(/\s+/g, "_")))
				}
				freeSolo
				disableClearable={variant == "edit"}
				renderTags={(value: readonly string[], getTagProps) => {
					return value.map((tag: string, index: number) => (
						// eslint-disable-next-line react/jsx-key
						<Chip
							variant="outlined"
							label={tag.replace(/_/g, "_" + String.fromCharCode(8203))}
							{...getTagProps({
								index
							})}
						/>
					));
				}}
				renderInput={params => (
					<>
						<UnpaddedFilledInput
							{...params}
							variant={variant == "search" ? "filled" : "outlined"}
							placeholder="Search"
						/>
						
						<div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}></div>
						{variant == "search" && enableOptions ? <IconButton onClick={handleClick} className="TagInput-SettingsButton">
							<TuneIcon />
						</IconButton> : <></>}
					</>
				)}
				renderOption={(props, option, state) =>
				{
					//[props, option, state.index] as React.ReactNode
								
					const tag = option;
					const category = BooruTag.getCategory(tag, categories);
					const formattedTag = Util.formatTag(tag);

					return (
						<Box component="li" {...props}>
							<Typography variant="subtitle1" color={category?.color}>
								{formattedTag}&nbsp;
							</Typography>
							<Typography variant="body2">{tagFrequencies[tag]}</Typography>
						</Box>
					);
				}}
				onSubmit={props.onSubmit}
			/>
			{optionsMenu}
		</div>
	);
};

export default TagInput;
