import { JsonProperty } from "json-object-mapper";
import { DateDeserializer, DateSerializer } from "../Serializers";

export class ApiImage
{
	public ownerId: string = "invalid";
	public filename: string = "";
	public fileSize: number = 0;
	public hash: string = "";
	public ext: string = "";
	public source: string | null = "";
	public width: number = 0;
	public height: number = 0;
	@JsonProperty({ serializer: DateSerializer, deserializer: DateDeserializer })
	public postedAt: Date = new Date();
	public locked: boolean = false;
	public author: string | null = "";
	public favoritesCount: number = 0;
	public parentId: string = "invalid";
	public hasChildren: boolean = false;
}