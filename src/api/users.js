import { apiFetch } from "./client";

export function getCurrentUser(signal) {
  return apiFetch("/api/v1/users/me", { signal });
}

export function updateCurrentUser(
  { name, grade, departmentId },
  signal,
) {
  return apiFetch("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify({
      name,
      grade,
      departmentId,
    }),
    signal,
  });
}

export function withdrawCurrentUser(signal) {
  return apiFetch("/api/v1/users/me", {
    method: "DELETE",
    body: JSON.stringify({ confirmed: true }),
    signal,
  });
}
