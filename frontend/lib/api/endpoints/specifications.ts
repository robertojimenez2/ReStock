import { apiClient } from "../client";
import type { Specification } from "../types";

export const specificationsApi = {
  listByMaterial(materialId: number): Promise<Specification[]> {
    return apiClient.get<Specification[]>(
      `/materials/${materialId}/specifications`
    );
  },
};