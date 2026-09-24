import { apiClient } from "../client";
import type { Material, MaterialStatus } from "../types";

export interface ListMaterialsParams {
  [key: string]: string | number | boolean | null | undefined;
  category?: string;
  skip?: number;
  limit?: number;
}

export const materialsApi = {
  list(params: ListMaterialsParams = {}): Promise<Material[]> {
    return apiClient.get<Material[]>("/materials", { params  });
  },

  get(id: number): Promise<Material> {
    return apiClient.get<Material>(`/materials/${id}`);
  },
};