/** @format */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Config, readConfig } from "./config";
import { Database } from "./database";
import fs from "fs/promises";
import rfs from "fs";
import path from "path";
import ffprobe from "ffprobe";
import ffmpeg from "ffmpeg";
import { createHash } from "crypto";
import tmp from "tmp";

const config: Config = readConfig();
const database: Database = new Database(config);

const client = new S3Client({
	endpoint: config.s3Endpoint,
	region: config.s3Region,
	credentials: {
		accessKeyId: config.s3AccessKey,
		secretAccessKey: config.s3SecretKey
	}
});

async function findExecutable(exe): Promise<string> {
	const envPath = process.env.PATH || "";
	const envExt = process.env.PATHEXT || "";
	const pathDirs = envPath.replace(/["]+/g, "").split(path.delimiter).filter(Boolean);
	const extensions = envExt.split(";");
	const candidates = pathDirs.flatMap(d => extensions.map(ext => path.join(d, exe + ext)));
	try {
		return await Promise.any(candidates.map(checkFileExists));
	} catch (e) {
		return null;
	}

	async function checkFileExists(filePath): Promise<string> {
		if ((await fs.stat(filePath)).isFile()) {
			return filePath;
		}
		throw new Error("Not a file");
	}
}

function runFfprobe(file: string, ffmpeg: string): Promise<ffprobe.FFProbeResult> {
	return new Promise((resolve, reject) => {
		ffprobe(file, { path: ffmpeg }, (err, info) => {
			if (err != null) {
				reject(err);
			} else {
				resolve(info);
			}
		});
	});
}

function hashFile(file: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const fd = rfs.createReadStream(file);

		const hash = createHash("md5");
		hash.setEncoding("hex");
		fd.on("end", () => {
			hash.end();
			resolve(hash.digest("hex").toLowerCase());
		});

		fd.pipe(hash);
	});
}

function getThumbnailSize(size: [number, number]): [number, number] {
	const maxWidth = 192;
	const maxHeight = 192;

	const xScale = maxWidth / size[0];
	const yScale = maxHeight / size[1];
	const scale = yScale < xScale ? yScale : xScale;

	return [Math.floor(size[0] * scale), Math.floor(size[1] * scale)];
}

async function processFile(file: string, ffprobe: string) {
	const hash = await hashFile(file);
	if (await database.checkExists(hash)) {
		console.log(`${file} already exists`);
		return;
	}

	const info = await runFfprobe(file, ffprobe).catch(f => {
		console.log(`skipping ${file} - ${f}`);
		return Promise.resolve(null);
	});

	if (info == null) {
		return Promise.resolve(null);
	}

	const streams = info.streams.filter(s => s.codec_type == "video");

	if (streams.length == 0) {
		return Promise.reject("no streams");
	}

	const stats = await fs.stat(file);

	const width = streams[0].width;
	const height = streams[0].height;
	const duration = Number(streams[0].duration);
	const thumbnailPoint = Math.floor(duration / 2);

	const thumbnailSize = getThumbnailSize([width, height]);
	const v = await new ffmpeg(file);
	v.addCommand("-ss", thumbnailPoint.toString());
	v.addCommand("-y", "");
	v.addCommand("-vf", `scale=${thumbnailSize[0]}:${thumbnailSize[1]},thumbnail`);
	v.addCommand("-f", "image2");
	v.addCommand("-vframes", "1");
	v.addCommand("-c:v", "png");

	const thumbName = tmp.tmpNameSync();
	const thumbnailPath = await v.save(thumbName);

	const putThumbCommand = new PutObjectCommand({
		Key: "thumbs/" + hash,
		Body: rfs.createReadStream(thumbnailPath),
		Bucket: config.s3Bucket
	});

	const putImageCommand = new PutObjectCommand({
		Key: "images/" + hash,
		Body: rfs.createReadStream(file),
		Bucket: config.s3Bucket
	});

	let ext = path.extname(file);
	if (ext.length > 0) {
		ext = ext.substr(1);
	}

	await Promise.all([client.send(putThumbCommand), client.send(putImageCommand)]);
	await database.insertImage(path.basename(file), stats.size, hash, ext, width, height);
	console.log(`uploaded ${file}`);
}

async function processFiles(dir: string, ffprobe: string) {
	const files = await fs.readdir(dir);
	const promises = files.map(f => processFile(path.join(dir, f), ffprobe));
	await Promise.all(promises);
	console.log("done");
	process.exit(0);
}

findExecutable("ffprobe").then(f => {
	processFiles(process.argv[process.argv.length - 1], f);
});
