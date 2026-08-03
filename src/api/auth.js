import { USE_SAME_ORIGIN_API, apiFetch, createApiUrl } from "./client";

export function getGoogleLoginUrl() {
  if (USE_SAME_ORIGIN_API) {
    return "/oauth2/authorization/google";
  }

  return createApiUrl("/api/v1/auth/google");
}

export function getAuthSession(signal) {
  return apiFetch("/api/v1/auth/session", { signal });
}
