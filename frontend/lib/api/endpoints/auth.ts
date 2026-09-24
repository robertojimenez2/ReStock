import { apiClient } from "../client";
import type { TokenResponse, User, RegisterPayload } from "../types";

export const authApi = {
  register(payload: RegisterPayload): Promise<User> {
    return apiClient.post<User>("/auth/register", payload);
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const body = new URLSearchParams();
    body.set("username", email);
    body.set("password", password);

    // La respuesta trae el token en el body, pero el navegador guarda
    // la cookie httpOnly automáticamente. El frontend ignora el body.
    return apiClient.post<TokenResponse>("/auth/login", body);
  },

  logout(): Promise<void> {
    return apiClient.post<void>("/auth/logout");
  },

  me(): Promise<User> {
    return apiClient.get<User>("/auth/me");
  },
};