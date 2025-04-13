/** @format */
import { BooruPool, ShimmiePool } from "../../models/BooruPool";
import {
	BooruTag,
	BooruTagCategory,
	ShimmieTagCategory
} from "../../models/BooruTag";
import { ApiResponse } from "../ApiResponse";
import { BooruRequest } from "../BooruRequest";

export interface PoolListRequest {
	limit: number;
	offset: number;
}

interface PoolListResponse {
	pools: BooruPool[];
	count: number;
}

interface RawPoolListResponse {
	pools: ShimmiePool[];
	count: number;
}

class PoolService {
	static async getPools(
		req: PoolListRequest
	): Promise<ApiResponse<PoolListResponse>> {
		return BooruRequest.queryResult<RawPoolListResponse>(
			`/pool/list?limit=${req.limit}&offset=${req.offset}`
		).then(response =>
			response.map(val => ({
				pools: val.pools.map(p => new BooruPool(p)),
				count: val.count
			}))
		);
	}

	static async getPool(poolId: string): Promise<ApiResponse<BooruPool>> {
		return BooruRequest.queryResult<ShimmiePool>(
			"/pool/info?id=" + poolId
		).then(response => response.map(val => new BooruPool(val)));
	}
}

export default PoolService;
