/** @format */

import { BooruRequest } from "../BooruRequest";
import { User } from "../../models/BooruUser";
import { LocalSettings } from "../../util/LocalSettings";
import { BooruImage, ShimmieImage } from "../../models/BooruImage";

export interface ImageSearchRequest {
	query: string | null;
	page: number;
}

export interface ImageGetRequest {
	image: BooruImage;
	pageIndex: number;
}

export interface ImageGetByIdRequest {
	imageId: string;
}

class ImageService {
	static async getImageById(id: string): Promise<BooruImage | null> 
	{
		return BooruRequest.runQueryJson("/api/shimmie/get_image/" + id).then(v => {
			if (Object.keys(v).length == 0) 
			{
				return null;
			}

			return new BooruImage(v as ShimmieImage);
		});
	}
}

export default ImageService;
