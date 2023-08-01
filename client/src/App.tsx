/** @format */

import React from "react";
import { Container } from "@mui/material";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NotificationsSystem, { atalhoTheme, dismissNotification } from "reapop";

import { useAppDispatch, useAppSelector } from "./features/Hooks";
import RootPage from "./routes/RootPage";
import ErrorPage from "./routes/ErrorPage";
import ListPage from "./routes/ListPage";
import ImagePage from "./routes/ImagePage";
import { imageDirectLink } from "./features/images/ImageSlice";
import { ImageGetByIdRequest } from "./features/images/ImageService";

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
					path: "/images/view/:imageId",
					element: <ImagePage />
				},
				{
					path: "/images/:page",
					element: <ListPage />
				},
				{
					path: "/images",
					element: <ListPage />
				},
				{
					// TODO: clicking the "Tango" at the top shouldn't bring you back to the current page - it should be back to the first page
					element: <ListPage forceIndex={true} />,
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
