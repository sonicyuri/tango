/** @format */
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { AppBar, Box, IconButton, Link as MuiLink, Menu, MenuItem, Toolbar } from "@mui/material";
import React, { useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";

import { logout, selectAuthState } from "../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { selectPostState } from "../features/posts/PostSlice";
import i18n from "../util/Internationalization";
import { LogFactory } from "../util/Logger";
import { Util } from "../util/Util";
import SearchBox from "./SearchBox";

const logger = LogFactory.create("MenuBar");

const MenuBar = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const { cursor } = useAppSelector(selectPostState);
	const { user } = useAppSelector(selectAuthState);
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
			<MenuItem component={RouterLink} to={Util.makePostsLink("favorited_by=" + user?.username, 1)}>
				Favorites
			</MenuItem>
			<MenuItem>Settings</MenuItem>
			<MenuItem onClick={handleLogout}>Log Out</MenuItem>
		</Menu>
	);

	const handleRandomizeQuery = () => {
		const previousQueryParts = (cursor?.currentQuery || "").split(" ");
		const randomQuery = "order:random_" + Math.floor(Math.random() * 10000);
		const filteredParts = previousQueryParts.filter(p => !p.startsWith("order:random_"));
		const query = filteredParts.concat([randomQuery]).join(" ");
		navigate(Util.makePostsLink(query, 1));
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
						onClick={handleRandomizeQuery}>
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
