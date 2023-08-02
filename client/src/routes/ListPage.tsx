/** @format */

import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Credentials } from "../features/auth/AuthService";
import { LocalSettings } from "../util/LocalSettings";
import Spinner from "react-spinkit";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { login, selectAuthState } from "../features/auth/AuthSlice";
import { Link as MuiLink, Pagination, Box, Backdrop, Breadcrumbs, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { imageGet, imageList, imageSetPage, selectImageState } from "../features/images/ImageSlice";
import { LogFactory, Logger } from "../util/Logger";
import { Util } from "../util/Util";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import LoginPage from "./LoginPage";
import { BooruImage } from "../models/BooruImage";
import i18n from "../util/Internationalization";

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

	const { searchState, images, cursor } = useAppSelector(selectImageState);

	// base the number of columns on the width of the screen
	const [numColumns, setNumColumns] = useState(Math.floor(window.innerWidth / TargetImageWidth));

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
				imageList({
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
			imageList({
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

	const onImageClicked = (image: BooruImage, index: number) => {
		dispatch(
			imageGet({
				image,
				pageIndex: index
			})
		);

		// include information on the current list in the url so we can get back to it even with a direct link
		const page = cursor?.cursorPosition[0] || 1;
		const newQueryString = Util.formatQueryString([
			{ key: "q", value: cursor?.currentQuery || "", enabled: cursor?.currentQuery != null },
			{ key: "page", value: String(page), enabled: page != 1 }
		]);

		navigate(cursor.makeImageLink(image));
	};

	const onPageChange = (e: React.ChangeEvent<unknown>, page: number) => {
		dispatch(imageSetPage(page));
		let url = `/images/${page}`;
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
			<Typography color="text.primary">Images</Typography>
		</Breadcrumbs>
	);

	return (
		<div className="ListPage">
			<div className="PageHeader ListPage-header">
				{breadcrumbs}
				{renderPagination("pg-top")}
			</div>
			<Grid
				container
				spacing={3}
				sx={{
					maxWidth: "100%"
				}}>
				{images.map((img, idx) => {
					return (
						<Grid className="ListPage-grid" key={"image-" + img.hash} xs={12 / numColumns}>
							<div
								className="ListPage-grid-item"
								style={{ backgroundImage: `url(${img.thumbUrl})` }}
								onClick={() => onImageClicked(img, idx)}
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
