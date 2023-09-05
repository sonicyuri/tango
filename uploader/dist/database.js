"use strict";
/** @format */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mysql_1 = __importDefault(require("mysql"));
class Database {
    constructor(config) {
        this.connection = mysql_1.default.createConnection({
            host: config.mysqlHost,
            user: config.mysqlUser,
            password: config.mysqlPassword,
            database: config.mysqlDatabase,
            port: config.mysqlPort
        });
    }
    open() {
        this.connection.connect();
    }
    close() {
        this.connection.end();
    }
    checkExists(hash) {
        return new Promise((resolve, reject) => {
            this.connection.query("SELECT 1 FROM images WHERE hash = ?", [hash], (err, results, fields) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(results.length > 0);
                }
            });
        });
    }
    insertImage(filename, size, hash, ext, width, height) {
        return new Promise((resolve, reject) => {
            this.connection.query("INSERT INTO images (owner_id, owner_ip, filename, filesize, hash, ext, source, width, height, posted, locked, author, rating, favorites, parent_id, has_children, numeric_score) VALUES (2, '::1', ?, ?, ?, ?, NULL, ?, ?, NOW(), 'N', NULL, 'u', 0, NULL, 'N', 0)", [filename, size, hash, ext, width, height], (err, results, fields) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(results[0]);
                }
            });
        });
    }
}
exports.Database = Database;
//# sourceMappingURL=database.js.map