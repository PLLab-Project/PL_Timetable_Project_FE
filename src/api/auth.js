import { API_BASE_URL, ApiError, apiFetch } from "./client";

export function getGoogleLoginUrl() {
  if (!API_BASE_URL) {
    throw new ApiError(
      0,
      "API_BASE_URL_NOT_CONFIGURED",
      "VITE_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }

  return `${API_BASE_URL}/api/v1/auth/google`;
}

export function getAuthSession(signal) {
  return apiFetch("/api/v1/auth/session", { signal });
}
