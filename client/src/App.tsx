/** @format */
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NotificationsSystem, { atalhoTheme, dismissNotification } from "reapop";

import { useAppDispatch, useAppSelector } from "./features/Hooks";
import AdminPage from "./pages/admin/AdminPage";
import ErrorPage from "./pages/ErrorPage";
import ListPage from "./pages/ListPage";
import PostPage from "./pages/post_view/PostPage";
import RootPage from "./pages/RootPage";
import TagsListPage from "./pages/tags_list/TagsListPage";

const App = () => {
	const dispatch = useAppDispatch();
	const notifications = useAppSelector(state => state.notifications);

	const router = createBrowserRouter([
		{
			path: "/",
			element: <RootPage />,
			errorElement: <ErrorPage />,
			children: [
				{
					path: "/admin",
					element: <AdminPage />
				},
				{
					path: "/tags/list",
					element: <TagsListPage tab={"list"} />
				},
				{
					path: "/tags/cloud",
					element: <TagsListPage tab={"cloud"} />
				},
				{
					path: "/tags",
					element: <TagsListPage tab={"none"} />
				},
				{
					path: "/posts/view/:postId",
					element: <PostPage />
				},
				{
					path: "/posts/:page",
					element: <ListPage />
				},
				{
					path: "/posts",
					element: <ListPage />
				},
				{
					element: <ListPage />,
					index: true
				}
			]
		}
	]);

	return (
		<>
			<NotificationsSystem
				notifications={notifications}
				dismissNotification={id => dispatch(dismissNotification(id))}
				theme={atalhoTheme}
			/>
			<RouterProvider router={router} />
		</>
	);
};

export default App;
