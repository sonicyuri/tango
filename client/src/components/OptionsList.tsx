/** @format */
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { ReactElement } from "react";
import { Link } from "react-router-dom";

export type OptionsListItem = { type?: "entry"; icon?: ReactElement; text: string; url: string; class?: string; } | { type: "separator" };

export interface OptionsListProps {
	menuItems: OptionsListItem[];
	onItemClick?: () => void;
}

const OptionsList = (props: OptionsListProps) =>
{
	let i = 0;
	return (
		<List>
			{props.menuItems.map(item =>
			{
				if (item.type == "separator")
				{
					return (<ListItem key={"sep-" + i++} disablePadding className="OptionsList-separator"></ListItem>)
				}
				else
				{
					return (<ListItem key={item.text} disablePadding className={item.class ?? ""}>
						<ListItemButton
							onClick={() =>
							{
								if (props.onItemClick)
								{
									props.onItemClick();
								}
							}}
							component={Link}
							to={item.url}>
							<ListItemIcon>{item.icon}</ListItemIcon>
							<ListItemText primary={item.text} />
						</ListItemButton>
					</ListItem>);
				}
			})}
		</List>
	);
};

export default OptionsList;
