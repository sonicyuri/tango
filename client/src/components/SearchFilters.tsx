/** @format */

import { Button, FormControl, Switch } from "@mui/base";
import { ButtonGroup, FormControlLabel, FormGroup, IconButton, Popover } from "@mui/material";
import { useState } from "react";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import VideocamIcon from "@mui/icons-material/Videocam";
import VrpanoIcon from "@mui/icons-material/Vrpano";
import { SearchFilterOptions } from "../features/SearchFilterOptions";
import theme from "../MuiTheme";
import { useAppDispatch } from "../features/Hooks";
import { postList, postListRefresh } from "../features/posts/PostSlice";

interface SearchFiltersProps {
	open: boolean;
	onClose: () => void;
	anchorEl: null | HTMLElement;
	activeFilters: SearchFilterOptions;
}

export const SearchFilters = (props: SearchFiltersProps) => {
	const { showVideo, showImages, showVr } = props.activeFilters;
	const [rerenderDummy, setRerenderDummy] = useState(false);
	const dispatch = useAppDispatch();

	const updateFilters = () => {
		setRerenderDummy(!rerenderDummy);
		dispatch(postListRefresh(null));
	};

	return (
		<Popover
			open={props.open}
			onClose={props.onClose}
			anchorEl={props.anchorEl}
			anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			transformOrigin={{ vertical: "top", horizontal: "right" }}>
			<ButtonGroup variant="contained">
				<IconButton
					title="Show videos"
					style={{ background: showVideo ? theme.palette.primary.main : "", borderRadius: 0 }}
					onClick={() => {
						props.activeFilters.showVideo = !props.activeFilters.showVideo;
						updateFilters();
					}}>
					<VideocamIcon />
				</IconButton>
				<IconButton
					title="Show images"
					style={{ background: showImages ? theme.palette.primary.main : "", borderRadius: 0 }}
					onClick={() => {
						props.activeFilters.showImages = !props.activeFilters.showImages;
						updateFilters();
					}}>
					<InsertPhotoIcon />
				</IconButton>
				<IconButton
					title="Show VR content"
					style={{ background: showVr ? theme.palette.primary.main : "", borderRadius: 0 }}
					onClick={() => {
						props.activeFilters.showVr = !props.activeFilters.showVr;
						updateFilters();
					}}>
					<VrpanoIcon />
				</IconButton>
			</ButtonGroup>
		</Popover>
	);
};
