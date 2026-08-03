const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
const rawSameOriginSetting =
  import.meta.env.VITE_USE_SAME_ORIGIN_API?.trim().toLowerCase();

export const USE_SAME_ORIGIN_API =
  import.meta.env.PROD && rawSameOriginSetting !== "false";

export const API_BASE_URL = USE_SAME_ORIGIN_API
  ? ""
  : rawApiBaseUrl.replace(/\/+$/, "");

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

let csrfToken = null;

export function createApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (USE_SAME_ORIGIN_API) {
    return normalizedPath;
  }

  if (!API_BASE_URL) {
    throw new ApiError(
      0,
      "API_BASE_URL_NOT_CONFIGURED",
      "VITE_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }

  return `${API_BASE_URL}${normalizedPath}`;
}

async function readEnvelope(response) {
  let body;

  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_API_RESPONSE",
      "서버 응답을 읽을 수 없습니다.",
    );
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.code ?? "API_REQUEST_FAILED",
      body?.message ?? "API 요청에 실패했습니다.",
    );
  }

  return body?.data;
}

export async function refreshCsrf(signal) {
  const response = await fetch(createApiUrl("/api/v1/auth/csrf"), {
    credentials: "include",
    signal,
  });
  const data = await readEnvelope(response);
  csrfToken = data?.token ?? null;
}

export function clearCsrf() {
  csrfToken = null;
}

export async function apiFetch(path, init = {}) {
  const method = (init.method ?? "GET").toUpperCase();

  if (MUTATING_METHODS.has(method) && csrfToken === null) {
    await refreshCsrf(init.signal);
  }

  const headers = new Headers(init.headers);

  if (MUTATING_METHODS.has(method) && csrfToken !== null) {
    headers.set("X-XSRF-TOKEN", csrfToken);
  }

  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(createApiUrl(path), {
    ...init,
    method,
    headers,
    credentials: "include",
  });

  try {
    return await readEnvelope(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearCsrf();
    }
    throw error;
  }
}
