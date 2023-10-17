/** @format */

import { BooruRequest } from "../BooruRequest";

export interface ImportPrepareResult {
	image_url: string;
	tags: string[];
}

export type ImportPrepareResponse =
	| { type: "success"; result: ImportPrepareResult }
	| { type: "error"; message: string };

class ImportService {
	static prepare(url: string): Promise<ImportPrepareResponse> {
		return BooruRequest.runQueryVersioned("v2", "/import/prepare", "POST", { url }).then(v => v.json());
	}
}

export default ImportService;
