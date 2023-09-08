/** @format */
import SearchIcon from "@mui/icons-material/Search";
import { Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../features/Hooks";
import { LogFactory } from "../util/Logger";
import TagInput from "./TagInput";

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

	useEffect(() => {
		setValues(defaultValue);
	}, [props.query]);

	const handleSearch = () => {
		navigate(`/posts/1?q=${encodeURIComponent(values.join(" "))}`);
	};

	return (
		<div
			className="search-box"
			style={{
				display: "flex"
			}}>
			<TagInput
				values={values}
				onValuesChange={v => setValues(v.map(v => v.toString()))}
				onSubmit={handleSearch}
			/>
			<Button variant="contained" onClick={handleSearch}>
				<SearchIcon />
			</Button>
		</div>
	);
};

export default SearchBox;
