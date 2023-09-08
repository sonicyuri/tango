/** @format */

import { Home, Tag } from "@mui/icons-material";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { Box } from "@mui/system";
import { JSXElement } from "@typescript-eslint/types/dist/generated/ast-spec";
import React, { ReactElement } from "react";
import { Link } from "react-router-dom";

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
				<List>
					{menuItems.map(item => (
						<ListItem key={item.text} disablePadding>
							<ListItemButton onClick={props.onClose} component={Link} to={item.url}>
								<ListItemIcon>{item.icon}</ListItemIcon>
								<ListItemText primary={item.text} />
							</ListItemButton>
						</ListItem>
					))}
				</List>
			</Box>
		</Drawer>
	);
}
