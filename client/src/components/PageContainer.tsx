/** @format */

import { Paper, Typography, Container, Box } from "@mui/material";

export interface PageContainerProps {
	children?: React.ReactNode;
	/**
	 * If set, this will be shown as an h3 as the title of the page.
	 */
	title?: string;
	/**
	 * If set, this will be rendered alongside the title h3 within its container.
	 */
	header?: React.ReactNode;
	style?: React.CSSProperties;
}

/**
 * Renders the container used for standalone pages (tag list, profile, admin page, etc)
 */
const PageContainer = (props: PageContainerProps) => {
	return (
		<Container style={props.style}>
			<Paper elevation={24} style={{ padding: "20px" }}>
				{props.title || props.header ? (
					<Box style={{ display: "flex", alignItems: "center", paddingBottom: "10px" }}>
						{props.title ? (
							<Typography variant="h3" style={{ flexGrow: 1 }}>
								{props.title}
							</Typography>
						) : (
							<></>
						)}
						{props.header}
					</Box>
				) : (
					<></>
				)}
				{props.children}
			</Paper>
		</Container>
	);
};

export default PageContainer;
