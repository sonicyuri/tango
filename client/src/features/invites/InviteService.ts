/** @format */
import { BooruRequest } from "../BooruRequest";

interface InviteModel
{
	id: string;
	creator_id: string;
	invite_code: string;
	redeemed: boolean;
	redeemed_time: string;
}

export interface InviteResponse
{
	id: string;
	creator_id: string;
	invite_code: string;
	redeemed: boolean;
	redeemed_time: Date
}

function convertModel(model: InviteModel): InviteResponse
{
	return {
		id: String(model.id),
		creator_id: String(model.creator_id),
		invite_code: model.invite_code,
		redeemed: model.redeemed,
		redeemed_time: new Date(model.redeemed_time)
	};
}

type InviteListResult = { type: "success"; result: { invites: InviteModel[] } } | { type: "error"; message: string };
export type InviteListResponse = { type: "success"; result: InviteResponse[] } | { type: "error"; message: string };

class InviteService
{
	static list(): Promise<InviteListResponse>
	{
		return BooruRequest.runQueryJsonV2("/user/invite/list").then(r =>
		{
			let result = r as InviteListResult;
			if (result.type == "success")
			{
				return { type: "success", result: result.result.invites.map(convertModel) };
			}
			else
			{
				return { type: "error", message: result.message };
			}
		});
	}

	static create(): Promise<InviteListResponse>
	{
		return BooruRequest.runQueryVersioned("v2", "/user/invite/new", "POST", {}).then(r => r.json()).then(r =>
		{
			let result = r as InviteListResult;
			if (result.type == "success")
			{
				return { type: "success", result: result.result.invites.map(convertModel) };
			}
			else
			{
				return { type: "error", message: result.message };
			}
		});
	}

	static delete(invite_id: string): Promise<InviteListResponse>
	{
		return BooruRequest.runQueryVersioned("v2", "/user/invite/delete", "POST", { invite_id: Number(invite_id) }).then(r => r.json()).then(r =>
		{
			let result = r as InviteListResult;
			if (result.type == "success")
			{
				return { type: "success", result: result.result.invites.map(convertModel) };
			}
			else
			{
				return { type: "error", message: result.message };
			}
		});
	}
}

export default InviteService;
