import { apiFetch } from "./client";

export function getCurrentUser(signal) {
  return apiFetch("/api/v1/users/me", { signal });
}

export function updateCurrentUser(
  {
    studentNumber,
    name,
    grade,
    departmentId,
    academicPrograms,
    admissionYear,
    studentType,
    programPath,
    tutorialCompleted,
  },
  signal,
) {
  const body = Object.fromEntries(
    Object.entries({
      studentNumber,
      name,
      grade,
      departmentId,
      academicPrograms,
      admissionYear,
      studentType,
      programPath,
      tutorialCompleted,
    }).filter(([, value]) => value !== undefined && value !== null),
  );

  return apiFetch("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
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
