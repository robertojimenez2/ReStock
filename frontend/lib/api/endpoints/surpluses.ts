import { apiClient } from "../client";
import type {
  Surplus,
  SurplusCreatePayload,
  SurplusStatus,
} from "../types";

export interface ListSurplusesParams {
  [key: string]: string | number | boolean | null | undefined;
  mine?: boolean;
  status?: SurplusStatus;
  material_id?: number;
  min_price?: number;
  max_price?: number;
  skip?: number;
  limit?: number;
}

export interface UpdateSurplusPayload {
  quantity?: string;
  unit?: string;
  unit_price?: string;
  description?: string | null;
  specifications?: SurplusCreatePayload["specifications"];
}

export const surplusesApi = {
  list(params: ListSurplusesParams = {}): Promise<Surplus[]> {
    return apiClient.get<Surplus[]>("/surpluses", { params });
  },

  get(id: number): Promise<Surplus> {
    return apiClient.get<Surplus>(`/surpluses/${id}`);
  },

  create(payload: SurplusCreatePayload): Promise<Surplus> {
    return apiClient.post<Surplus>("/surpluses", payload);
  },

  update(id: number, payload: UpdateSurplusPayload): Promise<Surplus> {
    return apiClient.patch<Surplus>(`/surpluses/${id}`, payload);
  },

  changeStatus(id: number, status: SurplusStatus): Promise<Surplus> {
    return apiClient.patch<Surplus>(`/surpluses/${id}/status`, { status });
  },

  deactivate(id: number): Promise<Surplus> {
    return apiClient.delete<Surplus>(`/surpluses/${id}`);
  },
};