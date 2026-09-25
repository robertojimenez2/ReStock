import { apiClient } from "../client";
import type { Transaction, TransactionStatus } from "../types";

export interface ListTransactionsParams {
  status?: TransactionStatus;
  skip?: number;
  limit?: number;
}

export const transactionsApi = {
  list(params: ListTransactionsParams = {}): Promise<Transaction[]> {
    return apiClient.get<Transaction[]>("/transactions", { params: {...params} });
  },

  get(id: number): Promise<Transaction> {
    return apiClient.get<Transaction>(`/transactions/${id}`);
  },

  changeStatus(
    id: number,
    status: TransactionStatus,
    notes?: string
  ): Promise<Transaction> {
    return apiClient.patch<Transaction>(`/transactions/${id}/status`, {
      status,
      notes,
    });
  },
};