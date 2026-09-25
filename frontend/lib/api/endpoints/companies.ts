import { apiClient } from "../client";
import type { Company } from "../types";

export interface CompanyUpdatePayload {
  name?: string;
  legal_name?: string;
  industry?: string;
  description?: string | null;
  city?: string;
  state?: string;
  address?: string | null;
}

export const companiesApi = {
  getMy(): Promise<Company> {
    return apiClient.get<Company>("/companies/me");
  },

  updateMy(payload: CompanyUpdatePayload): Promise<Company> {
    return apiClient.patch<Company>("/companies/me", payload);
  },
};