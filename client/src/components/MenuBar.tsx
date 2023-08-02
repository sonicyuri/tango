/** @format */

import { Link as RouterLink, useNavigate, useRouteError, useSearchParams } from "react-router-dom";
import React, { useState } from "react";
import { LogFactory } from "../util/Logger";
import { BooruImage } from "../models/BooruImage";
import TagInput from "./TagInput";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { imageList, selectImageState } from "../features/images/ImageSlice";
import { AppBar, IconButton, Toolbar, Typography, Link as MuiLink, Box, Menu, MenuItem } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SearchBox from "./SearchBox";
import { logout } from "../features/auth/AuthSlice";
import i18n from "../util/Internationalization";
import { Util } from "../util/Util";

const logger = LogFactory.create("MenuBar");

const MenuBar = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const { cursor } = useAppSelector(selectImageState);
	const [params, setParams] = useSearchParams();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const isMenuOpen = Boolean(anchorEl);

	const accountMenuId = "account-menu";

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleLogout = () => {
		dispatch(logout());
	};

	const accountMenu = (
		<Menu
			anchorEl={anchorEl}
			anchorOrigin={{
				vertical: "top",
				horizontal: "right"
			}}
			id={accountMenuId}
			keepMounted
			transformOrigin={{
				vertical: "top",
				horizontal: "right"
			}}
			open={isMenuOpen}
			onClose={handleMenuClose}>
			<MenuItem>Profile</MenuItem>
			<MenuItem>Favorites</MenuItem>
			<MenuItem>Settings</MenuItem>
			<MenuItem onClick={handleLogout}>Log Out</MenuItem>
		</Menu>
	);

	const handleRandomizeImages = () => {
		const previousQueryParts = (cursor?.currentQuery || "").split(" ");
		const randomQuery = "order:random_" + Math.floor(Math.random() * 10000);
		const query = previousQueryParts.filter(p => !p.startsWith("order:random_")).join(" ") + " " + randomQuery;
		navigate(Util.makeImagesLink(query, 1));
	};

	return (
		<>
			<AppBar position="static" className="MenuBar">
				<Toolbar>
					<IconButton
						size="large"
						edge="start"
						color="inherit"
						aria-label="open menu"
						sx={{
							mr: 2
						}}>
						<MenuIcon />
					</IconButton>
					<MuiLink
						variant="h4"
						noWrap
						component={RouterLink}
						to="/"
						color="inherit"
						underline="none"
						sx={{
							display: {
								xs: "none",
								sm: "block"
							}
						}}>
						{i18n.t("siteTitle")}
					</MuiLink>
					<Box
						className="MenuBar-search"
						sx={{
							flexGrow: 1,
							ml: 2
						}}>
						<SearchBox query={cursor?.currentQuery || params.get("q") || ""} />
					</Box>
					<IconButton
						size="large"
						color="inherit"
						aria-label="randomize"
						title="Randomize"
						sx={{}}
						onClick={handleRandomizeImages}>
						<ShuffleIcon />
					</IconButton>
					<IconButton
						size="large"
						edge="end"
						aria-label="current user account"
						aria-controls={accountMenuId}
						aria-haspopup="true"
						onClick={handleMenuOpen}
						color="inherit">
						<AccountCircleIcon />
					</IconButton>
				</Toolbar>
			</AppBar>
			{accountMenu}
		</>
	);
};

export default MenuBar;
