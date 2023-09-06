/** @format */

import { useNavigate } from "react-router";
import ReactWordcloud from "react-wordcloud";
import { useAppSelector } from "../../../features/Hooks";
import { selectTagState } from "../../../features/tags/TagSlice";
import { BooruTag } from "../../../models/BooruTag";
import { HeaderFonts } from "../../../MuiTheme";
import { Util } from "../../../util/Util";

import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";

interface TagCloudProps {
	tags: string[];
}

const TagCloud = (props: TagCloudProps) => {
	const { categories, tagFrequencies } = useAppSelector(selectTagState);
	const navigate = useNavigate();

	const words = props.tags.map(t => ({ text: t, value: tagFrequencies[t] })).sort((a, b) => b.value - a.value);

	return (
		<div style={{ aspectRatio: 1, textShadow: "#000000 1px 1px 2px" }}>
			<ReactWordcloud
				words={words}
				options={{
					fontFamily: "Palanquin",
					fontSizes: [5, 120],
					rotations: 0,
					scale: "log",
					spiral: "rectangular"
				}}
				callbacks={{
					onWordClick: (word, ev) => navigate(Util.makePostsLink(word.text, 1)),
					getWordColor: word => {
						const cat = BooruTag.getCategory(word.text, categories);
						return cat?.color ?? "#ffffff";
					},
					getWordTooltip: word => `${word.text}, ${word.value} use${word.value == 1 ? "" : "s"}`
				}}
			/>
		</div>
	);
};

export default TagCloud;
