import { apiClient } from "../client";
import type { Valuation } from "../types";

export interface ValuationParams {
  buyer_company_id?: number;
}

export const valuationApi = {
  forSurplus(
    surplusId: number,
    params: ValuationParams = {}
  ): Promise<Valuation> {
    return apiClient.get<Valuation>(`/valuation/surplus/${surplusId}`, {
      params: {...params},
    });
  },

  buyers(surplusId: number, limit = 20): Promise<Valuation[]> {
    return apiClient.get<Valuation[]>(
      `/valuation/surplus/${surplusId}/buyers`,
      { params: { limit } }
    );
  },
};