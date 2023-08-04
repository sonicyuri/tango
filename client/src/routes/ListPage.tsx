/** @format */
import {
	Backdrop,
	Box,
	Breadcrumbs,
	Link as MuiLink,
	Pagination,
	Typography,
	useMediaQuery,
	useTheme
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Spinner from "react-spinkit";

import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { postGet, postList, postSetPage, selectPostState } from "../features/posts/PostSlice";
import { BooruPost } from "../models/BooruPost";
import i18n from "../util/Internationalization";
import { LogFactory, Logger } from "../util/Logger";
import { Util } from "../util/Util";

const logger: Logger = LogFactory.create("ListPage");

interface ListPageProps {
	forceIndex?: boolean;
}

// the number of pixels wide we're aiming for each grid item to be
const TargetImageWidth = 210;

const ListPage = (props: ListPageProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const params = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const theme = useTheme();

	const { searchState, posts, cursor } = useAppSelector(selectPostState);

	// base the number of columns on the width of the screen
	const [numColumns, setNumColumns] = useState(Math.floor(window.innerWidth / TargetImageWidth));

	const canDisplayTopPagination = useMediaQuery(theme.breakpoints.up("sm"));

	// update the column count when resizing
	useEffect(() => {
		function onResize() {
			setNumColumns(Math.floor(window.innerWidth / TargetImageWidth));
		}

		window.addEventListener("resize", onResize);

		return () => {
			window.removeEventListener("resize", onResize);
		};
	});

	useEffect(() => {
		if (props.forceIndex) {
			dispatch(
				postList({
					query: null,
					page: 1
				})
			);
		}
	}, [props.forceIndex]);

	// send another query when the params change as well
	if (searchState == "initial" || searchParams.get("q") != cursor?.currentQuery) {
		const currentPage = Number(params.page) || 1;
		const query = searchParams.get("q");

		dispatch(
			postList({
				query: query,
				page: currentPage
			})
		);

		return <></>;
	} else if (searchState == "failed") {
		return Util.logAndDisplayError(logger, "search failed", cursor?.currentQuery, cursor?.cursorPosition);
	} else if (cursor == null) {
		logger.log("cursor is null (expected if just initializing)");
		return <></>;
	}

	const onPostClicked = (post: BooruPost, index: number) => {
		dispatch(
			postGet({
				post,
				pageIndex: index
			})
		);

		// include information on the current list in the url so we can get back to it even with a direct link
		const page = cursor?.cursorPosition[0] || 1;
		const newQueryString = Util.formatQueryString([
			{
				key: "q",
				value: cursor?.currentQuery || "",
				enabled: cursor?.currentQuery != null
			},
			{
				key: "page",
				value: String(page),
				enabled: page != 1
			}
		]);

		navigate(cursor.makePostLink(post));
	};

	const onPageChange = (e: React.ChangeEvent<unknown>, page: number) => {
		dispatch(postSetPage(page));
		let url = `/posts/${page}`;
		if (cursor != null && cursor.currentQuery != null) {
			url += "?q=" + encodeURIComponent(cursor.currentQuery);
		}
		navigate(url);
	};

	// we render the same pagination twice
	const renderPagination = (key: string) => {
		if (cursor == null) {
			return <></>;
		}

		return (
			<Box
				className="ListPage-pagination"
				sx={{
					display: "flex",
					justifyContent: "center"
				}}>
				<Pagination
					shape="rounded"
					variant="outlined"
					color="primary"
					key={key}
					count={cursor?.pageCount}
					page={cursor.cursorPosition[0]}
					onChange={onPageChange}
				/>
			</Box>
		);
	};

	const breadcrumbs = (
		<Breadcrumbs aria-label="breadcrumb" className="ListPage-breadcrumbs">
			<MuiLink underline="hover" color="inherit" component={RouterLink} to="/">
				{i18n.t("siteTitle")}
			</MuiLink>
			<Typography color="text.primary">Posts</Typography>
		</Breadcrumbs>
	);

	return (
		<div className="ListPage">
			<div className="PageHeader ListPage-header">
				{breadcrumbs}
				{canDisplayTopPagination ? renderPagination("pg-top") : <></>}
			</div>
			<Grid
				container
				spacing={3}
				sx={{
					maxWidth: "100%"
				}}>
				{posts.map((post, idx) => {
					return (
						<Grid className="ListPage-grid" key={"post-" + post.hash} xs={12 / numColumns}>
							<a
								href={cursor.makePostLink(post)}
								className="ListPage-grid-item"
								style={{ backgroundImage: `url(${post.thumbUrl})` }}
								onClick={e => {
									e.preventDefault();
									onPostClicked(post, idx);
								}}
							/>
						</Grid>
					);
				})}
			</Grid>
			<div className="ListPage-footer">{renderPagination("pg-bottom")}</div>
			<Backdrop open={searchState == "loading"}>
				<div>
					<Spinner name="wave" fadeIn="none" color="white" />
				</div>
			</Backdrop>
		</div>
	);
};

export default ListPage;
