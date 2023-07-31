/** @format */

import { useRouteError } from "react-router-dom";
import React from "react";
import { LogFactory } from "../util/Logger";

const logger = LogFactory.create("ErrorPage");

const ErrorPage = () => {
	const error = useRouteError() as any;
	logger.error(error);

	return (
		<>
			<h1>Error!</h1>
			<p>{error.statusText || error.message}</p>
		</>
	);
};

export default ErrorPage;
