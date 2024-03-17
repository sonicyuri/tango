/** @format */
import { ApiResponse } from "../ApiResponse";
import { BooruRequest } from "../BooruRequest";

interface InviteModel {
	id: string;
	creator_id: string;
	invite_code: string;
	redeemed: boolean;
	redeemed_time: string;
}

export interface InviteResponse {
	id: string;
	creator_id: string;
	invite_code: string;
	redeemed: boolean;
	redeemed_time: Date;
}

type InviteListResponse = { invites: InviteModel[] };

function convertModel(model: InviteModel): InviteResponse {
	return {
		id: String(model.id),
		creator_id: String(model.creator_id),
		invite_code: model.invite_code,
		redeemed: model.redeemed,
		redeemed_time: new Date(model.redeemed_time)
	};
}

class InviteService {
	static list(): Promise<ApiResponse<InviteResponse[]>> {
		return BooruRequest.queryResult<InviteListResponse>(
			"/user/invite/list"
		).then(response => response.map(val => val.invites.map(convertModel)));
	}

	static create(): Promise<ApiResponse<InviteResponse[]>> {
		return BooruRequest.queryResultAdvanced<InviteListResponse>(
			"/user/invite/new",
			"POST",
			{}
		).then(response => response.map(val => val.invites.map(convertModel)));
	}

	static delete(invite_id: string): Promise<ApiResponse<InviteResponse[]>> {
		return BooruRequest.queryResultAdvanced<InviteListResponse>(
			"/user/invite/delete",
			"POST",
			{
				invite_id: Number(invite_id)
			}
		).then(response => response.map(val => val.invites.map(convertModel)));
	}
}

export default InviteService;
