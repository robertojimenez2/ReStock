import { apiClient } from "../client";
import type {
  Offer,
  OfferCounterPayload,
  OfferCreatePayload,
  OfferStatus,
} from "../types";

export interface ListOffersParams {
  mine?: boolean;
  surplus_id?: number;
  status?: OfferStatus;
  skip?: number;
  limit?: number;
}

export const offersApi = {
  list(params: ListOffersParams = {}): Promise<Offer[]> {
    return apiClient.get<Offer[]>("/offers", { params: {...params} });
  },

  get(id: number): Promise<Offer> {
    return apiClient.get<Offer>(`/offers/${id}`);
  },

  create(payload: OfferCreatePayload): Promise<Offer> {
    return apiClient.post<Offer>("/offers", payload);
  },

  accept(id: number): Promise<{
    offer: Offer;
    transaction: import("../types").Transaction;
  }> {
    return apiClient.post(`/offers/${id}/accept`);
  },

  reject(id: number): Promise<Offer> {
    return apiClient.post<Offer>(`/offers/${id}/reject`);
  },

  counter(id: number, payload: OfferCounterPayload): Promise<Offer> {
    return apiClient.post<Offer>(`/offers/${id}/counter`, payload);
  },

  cancel(id: number): Promise<Offer> {
    return apiClient.post<Offer>(`/offers/${id}/cancel`);
  },
};