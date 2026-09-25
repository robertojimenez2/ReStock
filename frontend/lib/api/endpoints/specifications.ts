import { apiClient } from "../client";
import type {
  Specification,
  SpecificationDataType,
} from "../types";

export interface SpecificationCreatePayload {
  name: string;
  data_type: SpecificationDataType;
  unit?: string | null;
  description?: string | null;
  is_required?: boolean;
}

export interface SpecificationUpdatePayload {
  name?: string;
  data_type?: SpecificationDataType;
  unit?: string | null;
  description?: string | null;
  is_required?: boolean;
}

export const specificationsApi = {
  listByMaterial(materialId: number): Promise<Specification[]> {
    return apiClient.get<Specification[]>(
      `/materials/${materialId}/specifications`
    );
  },

  get(materialId: number, specificationId: number): Promise<Specification> {
    return apiClient.get<Specification>(
      `/materials/${materialId}/specifications/${specificationId}`
    );
  },

  create(
    materialId: number,
    payload: SpecificationCreatePayload
  ): Promise<Specification> {
    return apiClient.post<Specification>(
      `/materials/${materialId}/specifications`,
      payload
    );
  },

  update(
    materialId: number,
    specificationId: number,
    payload: SpecificationUpdatePayload
  ): Promise<Specification> {
    return apiClient.patch<Specification>(
      `/materials/${materialId}/specifications/${specificationId}`,
      payload
    );
  },

  delete(materialId: number, specificationId: number): Promise<void> {
    return apiClient.delete<void>(
      `/materials/${materialId}/specifications/${specificationId}`
    );
  },
};