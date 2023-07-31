import { Deserializer, Serializer } from "json-object-mapper";
import moment from "moment";


export class DateSerializer implements Serializer
{
	public serialize(value: Date): string
	{
		return moment(value).toISOString(true);
	}
}

export class DateDeserializer implements Deserializer
{
	public deserialize(value: string): Date
	{
		return moment(value).toDate();
	}
}