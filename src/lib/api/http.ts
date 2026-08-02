/**
 * The single HTTP boundary. It unwraps the backend's `{ data }` envelope and turns
 * `{ error }` responses into a typed `ApiError`, so no component ever inspects a
 * status code or a response body shape.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  /** True when the cause is a missing integration rather than a real failure. */
  get isNotConfigured(): boolean {
    return this.code === "not_configured";
  }
}

interface Envelope<T> {
  data?: T;
  error?: { code: string; message: string };
}

const BASE = "/api";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError("Cannot reach the Clarion API. Is the backend running?", 0, "network_error");
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as Envelope<T> | null;

  if (!response.ok || payload?.error) {
    throw new ApiError(
      payload?.error?.message ?? `Request failed (${response.status})`,
      response.status,
      payload?.error?.code ?? "request_failed"
    );
  }

  return payload?.data as T;
};

const withQuery = (path: string, query?: Record<string, unknown>): string => {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const serialised = params.toString();
  return serialised ? `${path}?${serialised}` : path;
};

export const http = {
  get: <T>(path: string, query?: Record<string, unknown>): Promise<T> =>
    request<T>(withQuery(path, query)),

  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  delete: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: "DELETE", body: body === undefined ? undefined : JSON.stringify(body) }),
};
