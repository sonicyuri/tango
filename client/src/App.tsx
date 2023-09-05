/** @format */
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NotificationsSystem, { atalhoTheme, dismissNotification } from "reapop";

import { useAppDispatch, useAppSelector } from "./features/Hooks";
import ErrorPage from "./routes/ErrorPage";
import ListPage from "./routes/ListPage";
import PostPage from "./modules/post_view/PostPage";
import RootPage from "./routes/RootPage";

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
