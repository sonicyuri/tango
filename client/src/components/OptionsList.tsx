/** @format */
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { ReactElement } from "react";
import { Link } from "react-router-dom";

export type OptionsListItem = { icon?: ReactElement; text: string; url: string };

export interface OptionsListProps {
	menuItems: OptionsListItem[];
	onItemClick?: () => void;
}

const OptionsList = (props: OptionsListProps) => {
	return (
		<List>
			{props.menuItems.map(item => (
				<ListItem key={item.text} disablePadding>
					<ListItemButton
						onClick={() => {
							if (props.onItemClick) {
								props.onItemClick();
							}
						}}
						component={Link}
						to={item.url}>
						<ListItemIcon>{item.icon}</ListItemIcon>
						<ListItemText primary={item.text} />
					</ListItemButton>
				</ListItem>
			))}
		</List>
	);
};

export default OptionsList;
