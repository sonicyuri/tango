/** @format */
import {
	Backdrop,
	Box,
	Breadcrumbs,
	Link as MuiLink,
	Pagination,
	Typography,
	useMediaQuery
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTheme } from "@mui/system";
import React, { useEffect, useState } from "react";
import {
	Link as RouterLink,
	useNavigate,
	useParams,
	useSearchParams
} from "react-router-dom";

import LoadingSpinner from "../../components/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import {
	poolList,
	postList,
	selectPostState
} from "../../features/posts/PostSlice";
import { BooruPost } from "../../models/BooruPost";
import i18n from "../../util/Internationalization";
import { LocalSettings } from "../../util/LocalSettings";
import { LogFactory, Logger } from "../../util/Logger";
import { Util } from "../../util/Util";
import { BooruPool } from "../../models/BooruPool";

const logger: Logger = LogFactory.create("PoolListPage");

// the number of pixels wide we're aiming for each grid item to be
const TargetImageWidth = 210;

const PoolListPage = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const params = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const theme = useTheme();

	const { poolState, pools, poolCount } = useAppSelector(selectPostState);

	// base the number of columns on the width of the screen
	const [numColumns, setNumColumns] = useState(
		Math.floor(window.innerWidth / TargetImageWidth)
	);

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

	const pageCount = Math.ceil(poolCount / LocalSettings.pageSize.value);
	const page =
		Math.ceil(Number(params.offset || 0) / LocalSettings.pageSize.value) +
		1;

	useEffect(() => {
		const currentOffset = Number(params.offset || 0);

		dispatch(
			poolList({
				limit: LocalSettings.pageSize.value,
				offset: currentOffset
			})
		);
	}, [params.offset]);

	if (poolState == "initial") {
		return <></>;
	} else if (poolState == "failed") {
		return Util.logAndDisplayError(logger, "list failed");
	}

	const poolUrl = (poolId: string) => {
		// TODO: add a real pool view page with pool info
		return Util.makePostsLink(`pool:${poolId} order:pool_order`, 1);
	};

	const onPoolClicked = (pool: BooruPool, index: number) => {
		navigate(poolUrl(pool.id));
	};

	const onPageChange = (e: React.ChangeEvent<unknown>, page: number) => {
		navigate(
			`/pools?limit=${LocalSettings.pageSize.value}&offset=${
				(page - 1) * LocalSettings.pageSize.value
			}`
		);
	};

	// we render the same pagination twice
	const renderPagination = (key: string) => {
		return (
			<Box
				className="PoolListPage-pagination"
				sx={{
					display: "flex",
					justifyContent: "center"
				}}>
				<Pagination
					shape="rounded"
					variant="outlined"
					color="primary"
					key={key}
					count={pageCount}
					page={page}
					onChange={onPageChange}
				/>
			</Box>
		);
	};

	const breadcrumbs = (
		<Breadcrumbs
			aria-label="breadcrumb"
			className="PoolListPage-breadcrumbs">
			<MuiLink
				underline="hover"
				color="inherit"
				component={RouterLink}
				to="/">
				{i18n.t("siteTitle")}
			</MuiLink>
			<Typography color="text.primary">Pools</Typography>
		</Breadcrumbs>
	);

	return (
		<div className="PoolListPage">
			<div className="PageHeader PoolListPage-header">
				{breadcrumbs}
				{canDisplayTopPagination ? renderPagination("pg-top") : <></>}
			</div>
			<Grid
				container
				spacing={3}
				sx={{
					maxWidth: "100%"
				}}>
				{pools.map((pool, idx) => {
					return (
						<Grid
							className="PoolListPage-grid"
							key={"pool-" + pool.id}
							xs={12 / numColumns}>
							<a
								href={poolUrl(pool.id)}
								className="PoolListPage-grid-item"
								style={{
									backgroundImage: `url(${BooruPost.getThumbUrl(
										pool.cover_hash
									)})`
								}}
								onClick={e => {
									e.preventDefault();
									onPoolClicked(pool, idx);
								}}
							/>
						</Grid>
					);
				})}
			</Grid>
			<div className="PoolListPage-footer">
				{renderPagination("pg-bottom")}
			</div>
			<Backdrop open={poolState == "loading"}>
				<div>
					<LoadingSpinner />
				</div>
			</Backdrop>
		</div>
	);
};

export default PoolListPage;
