/** @format */
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import VideoSettingsIcon from "@mui/icons-material/VideoSettings";
import { AppBar, Box, IconButton, Link as MuiLink, Menu, MenuItem, Toolbar } from "@mui/material";
import React, { useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";

import { UserClass } from "../models/user_classes/UserClass";
import { logout, selectAuthState } from "../features/auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../features/Hooks";
import { selectPostState } from "../features/posts/PostSlice";
import { SearchFilterOptions } from "../features/SearchFilterOptions";
import i18n from "../util/Internationalization";
import { LogFactory } from "../util/Logger";
import { Util } from "../util/Util";
import SearchBox from "./SearchBox";
import { SearchFilters } from "./SearchFilters";
import SideBar from "./SideBar";

const logger = LogFactory.create("MenuBar");

const MenuBar = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const { cursor } = useAppSelector(selectPostState);
	const { user } = useAppSelector(selectAuthState);
	const [params, setParams] = useSearchParams();

	const [showingSidebar, setShowingSidebar] = useState(false);

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [filterMenuEl, setFilterMenuEl] = useState<null | HTMLElement>(null);
	const isMenuOpen = Boolean(anchorEl);
	const isFilterMenuOpen = Boolean(filterMenuEl);

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

	const handleShowFilters = (event: React.MouseEvent<HTMLElement>) => {
		setFilterMenuEl(event.currentTarget);
	};

	const menuItems = [
		<MenuItem key="profile" component={RouterLink} to="/user/profile">
			Profile
		</MenuItem>,
		<MenuItem key="favorites" component={RouterLink} to={Util.makePostsLink("favorited_by=" + user?.username, 1)}>
			Favorites
		</MenuItem>,
		<MenuItem key="likes" component={RouterLink} to={Util.makePostsLink("upvoted_by=" + user?.username, 1)}>
			Likes
		</MenuItem>,
		<MenuItem key="dislikes" component={RouterLink} to={Util.makePostsLink("downvoted_by=" + user?.username, 1)}>
			Dislikes
		</MenuItem>,
		<MenuItem key="settings" disabled>
			Settings
		</MenuItem>
	];

	if (user && UserClass.canClass(user.class, "manage_admintools")) {
		menuItems.push(
			<MenuItem key="admin" component={RouterLink} to="/admin">
				Admin
			</MenuItem>
		);
	}

	menuItems.push(
		<MenuItem key="logout" onClick={handleLogout}>
			Log Out
		</MenuItem>
	);

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
			{menuItems}
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
			<SideBar open={showingSidebar} onClose={() => setShowingSidebar(false)} />
			<AppBar position="static" className="MenuBar">
				<Toolbar>
					<IconButton
						size="large"
						edge="start"
						color="inherit"
						aria-label="open menu"
						onClick={() => setShowingSidebar(true)}
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
						color="inherit"
						aria-label="search filters"
						title="Search Filters"
						sx={{}}
						onClick={handleShowFilters}>
						<VideoSettingsIcon />
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
			<SearchFilters
				activeFilters={SearchFilterOptions.instance}
				anchorEl={filterMenuEl}
				open={isFilterMenuOpen}
				onClose={() => setFilterMenuEl(null)}
			/>
		</>
	);
};

export default MenuBar;
