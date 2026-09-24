import { ApiError, NetworkError, type ValidationErrorItem } from "./errors";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type RequestOptions = Omit<RequestInit, "body" | "credentials"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  onUnauthorized?: () => void;
};

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(path, BASE_URL);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (response.status === 204) {
    return undefined as T;
  }

  if (!isJson) {
    const text = await response.text();
    throw new ApiError(
      response.status,
      text || `Error HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (response.ok) {
    return data as T;
  }

  const detail = data?.detail;

  if (typeof detail === "string") {
    throw new ApiError(response.status, detail, { raw: data });
  }

  if (Array.isArray(detail)) {
    const validation = detail as ValidationErrorItem[];
    const first = validation[0]?.msg ?? "Error de validación";
    throw new ApiError(response.status, first, {
      validation,
      raw: data,
    });
  }

  throw new ApiError(response.status, `Error HTTP ${response.status}`, {
    raw: data,
  });
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, onUnauthorized, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");

  const hasBody = body !== undefined;
  const isFormData = body instanceof FormData;
  const isUrlSearchParams = body instanceof URLSearchParams;

  if (hasBody && !isFormData && !isUrlSearchParams) {
    finalHeaders.set("Content-Type", "application/json");
  }

  let finalBody: BodyInit | undefined;
  if (hasBody) {
    if (isFormData || isUrlSearchParams) {
      finalBody = body as BodyInit;
    } else {
      finalBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: finalHeaders,
      body: finalBody,
      credentials: "include",   // ← CRÍTICO: envía la cookie
      ...rest,
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 401 && onUnauthorized) {
    onUnauthorized();
  }

  return parseResponse<T>(response);
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};