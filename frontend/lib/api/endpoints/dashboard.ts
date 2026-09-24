import { apiClient } from "../client";
import type { Dashboard } from "../types";

export const dashboardApi = {
  get(): Promise<Dashboard> {
    return apiClient.get<Dashboard>("/dashboard");
  },
};