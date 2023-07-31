/** @format */

import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Credentials } from "../features/auth/AuthService";
import { LocalSettings } from "../util/LocalSettings";
import Spinner from "react-spinkit";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { login, selectAuthState } from "../features/auth/AuthSlice";
import { Modal, Pagination, Box } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { imageGet, imageList, imageSetPage, selectImageState } from "../features/images/ImageSlice";
import { LogFactory, Logger } from "../util/Logger";
import { Util } from "../util/Util";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import LoginPage from "./LoginPage";
import { BooruImage } from "../models/BooruImage";

const logger: Logger = LogFactory.create("ListPage");

interface ListPageProps {
	forceIndex?: boolean;
}

// the number of pixels wide we're aiming for each grid item to be
const TargetImageWidth = 200;

const ListPage = (props: ListPageProps) => {
	const { isLoggedIn } = useAppSelector(selectAuthState);

	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const params = useParams();
	const [searchParams, setSearchParams] = useSearchParams();

	const { searchState, images, cursor } = useAppSelector(selectImageState);

	// base the number of columns on the width of the screen
	const [numColumns, setNumColumns] = useState(Math.floor(window.innerWidth / TargetImageWidth));

	// update the column count when resizing
	useEffect(() => {
		function onResize() 
		{
			setNumColumns(Math.floor(window.innerWidth / TargetImageWidth));
		}

		window.addEventListener("resize", onResize);

		return () => {
			window.removeEventListener("resize", onResize);
		};
	});

	useEffect(() => {
		if (props.forceIndex) 
		{
			dispatch(
				imageList({
					query: null,
					page: 1
				})
			);
		}
	}, [props.forceIndex]);

	if (!isLoggedIn) 
	{
		return <LoginPage />;
	}

	if (searchState == "initial") 
	{
		const currentPage = Number(params.page) || 1;
		const query = searchParams.get("q");

		dispatch(
			imageList({
				query: query,
				page: currentPage
			})
		);

		return <></>;
	} 
	else if (searchState == "failed") 
	{
		return <p>search failed</p>;
	} 
	else if (cursor == null) 
	{
		return <p>cursor is null?</p>;
	}

	const onImageClicked = (image: BooruImage, index: number) => {
		dispatch(
			imageGet({
				image,
				pageIndex: index
			})
		);

		// TODO: include query and page in URL so we know where we are when we refresh
		navigate("/images/view/" + image.id);
	};

	const onPageChange = (e: React.ChangeEvent<unknown>, page: number) => {
		dispatch(imageSetPage(page));
		let url = `/images/${page}`;
		if (cursor != null && cursor.currentQuery != null) 
		{
			url += "?q=" + encodeURIComponent(cursor.currentQuery);
		}
		navigate(url);
	};

	// we render the same pagination twice
	const renderPagination = (key: string) => {
		if (cursor == null) 
		{
			return <></>;
		}

		return (
			<Box
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

	return (
		<>
			{renderPagination("pg-top")}
			<Grid
				container
				spacing={3}
				sx={{
					pt: 1,
					maxWidth: "100%"
				}}>
				{images.map((img, idx) => {
					return (
						<Grid className="ListPage-grid" key={"image-" + img.hash} xs={12 / numColumns}>
							<img
								className="ListPage-grid-item"
								src={img.thumbUrl}
								alt={"Image " + img.hash + " thumbnail"}
								onClick={() => onImageClicked(img, idx)}
							/>
						</Grid>
					);
				})}
			</Grid>
			{renderPagination("pg-bottom")}
			<Modal
				open={searchState == "loading"}
				keepMounted
				aria-label="loading"
				sx={{
					alignItems: "center",
					justifyContent: "center",
					display: "flex"
				}}>
				<div>
					<Spinner name="wave" fadeIn="none" color="white" />
				</div>
			</Modal>
		</>
	);
};

export default ListPage;
