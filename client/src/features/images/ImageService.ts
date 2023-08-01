/** @format */

import { BooruRequest } from "../BooruRequest";
import { User } from "../../models/BooruUser";
import { LocalSettings } from "../../util/LocalSettings";
import { BooruImage, ShimmieImage } from "../../models/BooruImage";

export interface ImageListRequest {
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

// the request that needs to be made by a direct link to an ImagePage to bring it up to speed
export interface ImageDirectLinkRequest
{
	imageId: string;
	query: string | null;
	page: number | null;
}

export interface ImageSetTagsRequest
{
	image: BooruImage;
	tags: string
};

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

	static setImageTags(image: BooruImage, newTags: string): Promise<void>
	{
		const data = new URLSearchParams();
		data.append("postId", image.id);
		data.append("tags", newTags);

		return BooruRequest.runQuery("/api/shimmie/set_tags", "POST", data)
			.then(res => res.json())
			.then(res =>
			{
				if (res["result"] === "success")
				{
					return Promise.resolve();	
				}

				return Promise.reject(new Error(res["message"]));
			});
	}
}

export default ImageService;
