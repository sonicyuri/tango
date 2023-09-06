/** @format */

import "reflect-metadata";
import { Server } from "./Server";
import nconf from "nconf";

const server = new Server();
server.run();
