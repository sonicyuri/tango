/** @format */
import { FormControlLabel, FormGroup, Switch, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";

import PageContainer from "../../components/PageContainer";
import TagChipList from "../../components/TagChipList";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { selectTagState } from "../../features/tags/TagSlice";
import TagCloud from "./components/TagCloud";

interface TagsListProps {
	tab: "list" | "cloud" | "none";
}

const TagsListPage = (props: TagsListProps) => {
	const dispatch = useAppDispatch();

	const { tags, tagFrequencies, categories } = useAppSelector(selectTagState);

	const [showAll, setShowAll] = useState(false);

	const tagsToShow = Object.keys(tagFrequencies);
	const tagList = <TagChipList tags={tagsToShow} orderBy="popularity" limitTags={!showAll} />;
	const tagCloud = <TagCloud tags={tagsToShow} />;

	return (
		<PageContainer
			title="Tags List"
			header={
				<FormGroup>
					<FormControlLabel
						control={
							<Switch
								checked={showAll}
								onChange={(ev: React.ChangeEvent) => setShowAll(ev.target.checked)}
							/>
						}
						label="Show all"
					/>
				</FormGroup>
			}>
			<Tabs value={props.tab == "cloud" ? 1 : 0} aria-label="tabs list visualization mode">
				<Tab component={Link} label="List" to="/tags/list" />
				<Tab component={Link} label="Cloud" to="/tags/cloud" />
			</Tabs>
			{props.tab == "list" ? tagList : tagCloud}
		</PageContainer>
	);
};

export default TagsListPage;
