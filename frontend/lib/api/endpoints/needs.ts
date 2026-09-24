import { apiClient } from "../client";
import type { Need, NeedCreatePayload, NeedStatus } from "../types";

export interface ListNeedsParams {
  mine?: boolean;
  status?: NeedStatus;
  material_id?: number;
  min_quantity?: number;
  max_quantity?: number;
  min_max_price?: number;
  max_max_price?: number;
  skip?: number;
  limit?: number;
}

export interface UpdateNeedPayload {
  quantity?: string;
  unit?: string;
  max_price?: string | null;
  description?: string | null;
  specifications?: NeedCreatePayload["specifications"];
}

export const needsApi = {
  list(params: ListNeedsParams = {}): Promise<Need[]> {
    return apiClient.get<Need[]>("/needs", { params: { ...params } });
  },

  get(id: number): Promise<Need> {
    return apiClient.get<Need>(`/needs/${id}`);
  },

  create(payload: NeedCreatePayload): Promise<Need> {
    return apiClient.post<Need>("/needs", payload);
  },

  update(id: number, payload: UpdateNeedPayload): Promise<Need> {
    return apiClient.patch<Need>(`/needs/${id}`, payload);
  },

  changeStatus(id: number, status: NeedStatus): Promise<Need> {
    return apiClient.patch<Need>(`/needs/${id}/status`, { status });
  },

  deactivate(id: number): Promise<Need> {
    return apiClient.delete<Need>(`/needs/${id}`);
  },
};