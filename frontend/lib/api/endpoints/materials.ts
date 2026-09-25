import { apiClient } from "../client";
import type { Material, MaterialStatus } from "../types";

export interface ListMaterialsParams {
  category?: string;
  skip?: number;
  limit?: number;
}

export interface MaterialCreatePayload {
  name: string;
  category: string;
  description?: string | null;
}

export interface MaterialUpdatePayload {
  name?: string;
  category?: string;
  description?: string | null;
}

export const materialsApi = {
  list(params: ListMaterialsParams = {}): Promise<Material[]> {
    return apiClient.get<Material[]>("/materials", { params: {...params} });
  },

  get(id: number): Promise<Material> {
    return apiClient.get<Material>(`/materials/${id}`);
  },

  create(payload: MaterialCreatePayload): Promise<Material> {
    return apiClient.post<Material>("/materials", payload);
  },

  update(id: number, payload: MaterialUpdatePayload): Promise<Material> {
    return apiClient.patch<Material>(`/materials/${id}`, payload);
  },

  delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/materials/${id}`);
  },

  approve(id: number): Promise<Material> {
    return apiClient.post<Material>(`/materials/${id}/approve`);
  },

  reject(id: number): Promise<Material> {
    return apiClient.post<Material>(`/materials/${id}/reject`);
  },
};