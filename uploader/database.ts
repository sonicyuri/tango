/** @format */

import { Config } from "./config";
import mysql from "mysql";

export class Database {
	private connection: mysql.Connection;

	constructor(config: Config) {
		this.connection = mysql.createConnection({
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

	checkExists(hash: string) {
		return new Promise((resolve, reject) => {
			this.connection.query("SELECT 1 FROM images WHERE hash = ?", [hash], (err, results, fields) => {
				if (err) {
					reject(err);
				} else {
					resolve(results.length > 0);
				}
			});
		});
	}

	insertImage(filename: string, size: number, hash: string, ext: string, width: number, height: number) {
		return new Promise((resolve, reject) => {
			this.connection.query(
				"INSERT INTO images (owner_id, owner_ip, filename, filesize, hash, ext, source, width, height, posted, locked, author, rating, favorites, parent_id, has_children, numeric_score) VALUES (2, '::1', ?, ?, ?, ?, NULL, ?, ?, NOW(), 'N', NULL, 'u', 0, NULL, 'N', 0)",
				[filename, size, hash, ext, width, height],
				(err, results, fields) => {
					if (err) {
						reject(err);
					} else {
						resolve(results[0]);
					}
				}
			);
		});
	}
}
