/** @format */
import { Home, Tag } from "@mui/icons-material";
import { Box, Drawer } from "@mui/material";
import React, { ReactElement } from "react";

import OptionsList from "./OptionsList";

export interface SideBarProps {
	open: boolean;
	onClose: () => void;
}

export default function SideBar(props: SideBarProps) {
	const menuItems: { icon: ReactElement; text: string; url: string }[] = [
		{
			icon: <Home />,
			text: "Home",
			url: "/"
		},
		{
			icon: <Tag />,
			text: "Tags",
			url: "/tags/list"
		}
	];

	return (
		<Drawer anchor="left" open={props.open} onClose={props.onClose}>
			<Box sx={{ width: 250 }} role="presentation">
				<OptionsList menuItems={menuItems} onItemClick={props.onClose} />
			</Box>
		</Drawer>
	);
}
