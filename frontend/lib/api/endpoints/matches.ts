import { apiClient } from "../client";
import type { Match } from "../types";

export interface MatchesParams {
  exclude_own?: boolean;
  min_score?: number;
  limit?: number;
}

export const matchesApi = {
  forSurplus(surplusId: number, params: MatchesParams = {}): Promise<Match[]> {
    return apiClient.get<Match[]>(`/matches/for-surplus/${surplusId}`, {
      params: {...params},
    });
  },

  forNeed(needId: number, params: MatchesParams = {}): Promise<Match[]> {
    return apiClient.get<Match[]>(`/matches/for-need/${needId}`, { params: {...params} });
  },
};