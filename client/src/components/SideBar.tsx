/** @format */
import { Home, Tag } from "@mui/icons-material";
import { Box, Drawer } from "@mui/material";
import React, { ReactElement } from "react";

import OptionsList, { OptionsListItem } from "./OptionsList";

import GitHubIcon from "@mui/icons-material/GitHub";
import FileUploadIcon from "@mui/icons-material/FileUpload";

export interface SideBarProps {
	open: boolean;
	onClose: () => void;
}

export default function SideBar(props: SideBarProps) {
	const menuItems: OptionsListItem[] = [
		{
			icon: <Home />,
			text: "Home",
			url: "/"
		},
		{
			icon: <Tag />,
			text: "Tags",
			url: "/tags/list"
		},
		{
			icon: <FileUploadIcon />,
			text: "Upload",
			url: "/posts/new"
		},
		{
			type: "separator"
		},
		{
			icon: <GitHubIcon />,
			text: "View on GitHub",
			url: "https://github.com/sonicyuri/tango"
		}
	];

	return (
		<Drawer anchor="left" open={props.open} onClose={props.onClose}>
			<Box sx={{ width: 250 }} role="presentation">
				<OptionsList
					menuItems={menuItems}
					onItemClick={props.onClose}
				/>
			</Box>
		</Drawer>
	);
}
