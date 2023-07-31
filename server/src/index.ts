import express, { Express } from "express";
import nconf from "nconf";
import expressPino from "express-pino-logger";
import pino from "pino";

import createImageRouter from "./routes/ImageRouter";

const logger = pino();

nconf.argv().env().file({ file: "../config.json" });
const port: number = nconf.get("server:port");

const app: Express = express();

app.use(expressPino());

app.use(createImageRouter());

app.listen(port, () =>
{
	logger.info(`server running on port ${port}`);
});