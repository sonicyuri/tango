"use strict";
/** @format */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readConfig = void 0;
const fs_1 = __importDefault(require("fs"));
function readConfig() {
    if (!fs_1.default.existsSync("config.json")) {
        return null;
    }
    return JSON.parse(fs_1.default.readFileSync("config.json", { encoding: "utf-8" }));
}
exports.readConfig = readConfig;
//# sourceMappingURL=config.js.map