import express, { Router } from "express";

export default function createRouter(): Router
{
	const router = express.Router();

	router.use((req, res, next) =>
	{
		res.type("application/json");
		next();
	});

	router.get("/list", (req, res) =>
	{
		res.end();
	});

	return router;
}