/** @format */

import { Container, FormControlLabel, FormGroup, Paper, Switch, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { selectTagState } from "../../features/tags/TagSlice";
import { Util } from "../../util/Util";
import TagChipList from "../../components/TagChipList";
import { Box } from "@mui/system";
import TagCloud from "./components/TagCloud";

interface TagsListProps {
	tab: "list" | "cloud" | "none";
}

const TagsListPage = (props: TagsListProps) => {
	const dispatch = useAppDispatch();

	const { tags, tagFrequencies, categories } = useAppSelector(selectTagState);

	const [showAll, setShowAll] = useState(false);

	const tagsToShow = Object.keys(tagFrequencies).filter(t => showAll || tagFrequencies[t] > 2);
	const tagList = <TagChipList tags={tagsToShow} orderBy="popularity" />;
	const tagCloud = <TagCloud tags={tagsToShow} />;

	return (
		<Container>
			<Paper elevation={24} style={{ padding: "20px" }}>
				<Box style={{ display: "flex", alignItems: "center" }}>
					<Typography variant="h3" style={{ flexGrow: 1 }}>
						Tags
					</Typography>
					<FormGroup>
						<FormControlLabel
							control={<Switch checked={showAll} onChange={(ev, checked) => setShowAll(checked)} />}
							label="Show all"
						/>
					</FormGroup>
				</Box>
				<Tabs value={props.tab == "cloud" ? 1 : 0} aria-label="tabs list visualization mode">
					<Tab component={Link} label="List" to="/tags/list" />
					<Tab component={Link} label="Cloud" to="/tags/cloud" />
				</Tabs>
				{props.tab == "list" ? tagList : tagCloud}
			</Paper>
		</Container>
	);
};

export default TagsListPage;
