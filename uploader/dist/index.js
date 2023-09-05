"use strict";
/** @format */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("./config");
const database_1 = require("./database");
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ffprobe_1 = __importDefault(require("ffprobe"));
const ffmpeg_1 = __importDefault(require("ffmpeg"));
const crypto_1 = require("crypto");
const tmp_1 = __importDefault(require("tmp"));
const config = (0, config_1.readConfig)();
const database = new database_1.Database(config);
const client = new client_s3_1.S3Client({
    endpoint: config.s3Endpoint,
    region: config.s3Region,
    credentials: {
        accessKeyId: config.s3AccessKey,
        secretAccessKey: config.s3SecretKey
    }
});
function findExecutable(exe) {
    return __awaiter(this, void 0, void 0, function* () {
        const envPath = process.env.PATH || "";
        const envExt = process.env.PATHEXT || "";
        const pathDirs = envPath.replace(/["]+/g, "").split(path_1.default.delimiter).filter(Boolean);
        const extensions = envExt.split(";");
        const candidates = pathDirs.flatMap(d => extensions.map(ext => path_1.default.join(d, exe + ext)));
        try {
            return yield Promise.any(candidates.map(checkFileExists));
        }
        catch (e) {
            return null;
        }
        function checkFileExists(filePath) {
            return __awaiter(this, void 0, void 0, function* () {
                if ((yield promises_1.default.stat(filePath)).isFile()) {
                    return filePath;
                }
                throw new Error("Not a file");
            });
        }
    });
}
function runFfprobe(file, ffmpeg) {
    return new Promise((resolve, reject) => {
        (0, ffprobe_1.default)(file, { path: ffmpeg }, (err, info) => {
            if (err != null) {
                reject(err);
            }
            else {
                resolve(info);
            }
        });
    });
}
function hashFile(file) {
    return new Promise((resolve, reject) => {
        const fd = fs_1.default.createReadStream(file);
        const hash = (0, crypto_1.createHash)("md5");
        hash.setEncoding("hex");
        fd.on("end", () => {
            hash.end();
            resolve(hash.digest("hex").toLowerCase());
        });
        fd.pipe(hash);
    });
}
function getThumbnailSize(size) {
    const maxWidth = 192;
    const maxHeight = 192;
    const xScale = maxWidth / size[0];
    const yScale = maxHeight / size[1];
    const scale = yScale < xScale ? yScale : xScale;
    return [Math.floor(size[0] * scale), Math.floor(size[1] * scale)];
}
function processFile(file, ffprobe) {
    return __awaiter(this, void 0, void 0, function* () {
        const hash = yield hashFile(file);
        if (yield database.checkExists(hash)) {
            console.log(`${file} already exists`);
            return;
        }
        const info = yield runFfprobe(file, ffprobe).catch(f => {
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
        const stats = yield promises_1.default.stat(file);
        const width = streams[0].width;
        const height = streams[0].height;
        const duration = Number(streams[0].duration);
        const thumbnailPoint = Math.floor(duration / 2);
        const thumbnailSize = getThumbnailSize([width, height]);
        const v = yield new ffmpeg_1.default(file);
        v.addCommand("-ss", thumbnailPoint.toString());
        v.addCommand("-y", "");
        v.addCommand("-vf", `scale=${thumbnailSize[0]}:${thumbnailSize[1]},thumbnail`);
        v.addCommand("-f", "image2");
        v.addCommand("-vframes", "1");
        v.addCommand("-c:v", "png");
        const thumbName = tmp_1.default.tmpNameSync();
        const thumbnailPath = yield v.save(thumbName);
        const putThumbCommand = new client_s3_1.PutObjectCommand({
            Key: "thumbs/" + hash,
            Body: fs_1.default.createReadStream(thumbnailPath),
            Bucket: config.s3Bucket
        });
        const putImageCommand = new client_s3_1.PutObjectCommand({
            Key: "images/" + hash,
            Body: fs_1.default.createReadStream(file),
            Bucket: config.s3Bucket
        });
        let ext = path_1.default.extname(file);
        if (ext.length > 0) {
            ext = ext.substr(1);
        }
        yield Promise.all([client.send(putThumbCommand), client.send(putImageCommand)]);
        yield database.insertImage(path_1.default.basename(file), stats.size, hash, ext, width, height);
        console.log(`uploaded ${file}`);
    });
}
function processFiles(dir, ffprobe) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield promises_1.default.readdir(dir);
        const promises = files.map(f => processFile(path_1.default.join(dir, f), ffprobe));
        yield Promise.all(promises);
        console.log("done");
        process.exit(0);
    });
}
findExecutable("ffprobe").then(f => {
    processFiles(process.argv[process.argv.length - 1], f);
});
//# sourceMappingURL=index.js.map