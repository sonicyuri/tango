/** @format */

import { useNavigate, useRouteError } from "react-router-dom";
import React, { useState } from "react";
import { LogFactory } from "../util/Logger";
import { BooruImage } from "../models/BooruImage";
import TagInput from "./TagInput";
import { useAppDispatch } from "../features/Hooks";
import { imageList } from "../features/images/ImageSlice";
import { Button } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const logger = LogFactory.create("SearchBox");

export interface SearchBoxProps {
	query: string;
}

const SearchBox = (props: SearchBoxProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const defaultValue = props.query
		.split(" ")
		.map(f => f.trim())
		.filter(f => f.length > 0);

	const [values, setValues] = useState(defaultValue);

	const handleSearch = () => {
		dispatch(
			imageList({
				query: values.join(" "),
				page: 1
			})
		);

		navigate(`/images/1?q=${encodeURIComponent(values.join(" "))}`);
	};

	return (
		<div
			className="search-box"
			style={{
				display: "flex"
			}}>
			<TagInput values={values} onValuesChange={v => setValues(v)} onSubmit={handleSearch} />
			<Button variant="contained" onClick={handleSearch}>
				<SearchIcon />
			</Button>
		</div>
	);
};

export default SearchBox;
