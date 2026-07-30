import { apiFetch } from "./client";

export async function getGraduationEvaluation(
  { semesterId } = {},
  signal,
) {
  const searchParams = new URLSearchParams();

  if (semesterId) {
    searchParams.set("semesterId", semesterId);
  }

  const query = searchParams.toString();
  return apiFetch(
    `/api/v1/graduation/me/evaluation${query ? `?${query}` : ""}`,
    { signal },
  );
}
