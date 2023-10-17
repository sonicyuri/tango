/** @format */

import { Button, Popover, TextField } from "@mui/material";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import LoadingOverlay from "../../../components/LoadingOverlay";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../../../features/Hooks";
import { importPrepare, selectImportState } from "../../../features/import/ImportSlice";
import { BooruPost } from "../../../models/BooruPost";

interface ImportButtonProps {
	post: BooruPost;
	onChange: (visible: boolean) => void;
}

const ImportButton = (props: ImportButtonProps) => {
	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
	const [url, setUrl] = useState("");
	const { loadingState } = useAppSelector(selectImportState);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
		props.onChange(true);
	};

	const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key == "Escape") {
			setAnchorEl(null);
			props.onChange(false);
		} else if (event.key == "Enter") {
			dispatch(importPrepare({ url, post: props.post }))
				.unwrap()
				.then(() => {
					setUrl("");
					setAnchorEl(null);
					props.onChange(false);
					navigate("/import");
					return true;
				})
				.catch(() => false);
		}
	};

	const handleClose = () => {
		setAnchorEl(null);
		props.onChange(false);
	};

	const open = Boolean(anchorEl);

	return (
		<>
			<Button variant="outlined" onClick={handleClick}>
				Import
			</Button>
			<Popover
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
				transformOrigin={{ vertical: "top", horizontal: "left" }}>
				<TextField
					variant="outlined"
					label="URL to import..."
					value={url}
					onChange={ev => {
						setUrl(ev.target.value);
					}}
					onKeyUp={handleKey}
				/>
				<LoadingOverlay isLoading={loadingState == "loading"} />
			</Popover>
		</>
	);
};

export default ImportButton;
