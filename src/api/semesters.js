import { apiFetch } from "./client";

export function getSemesters(signal) {
  return apiFetch("/api/v1/semesters", { signal });
}

function semesterSortValue(semester) {
  const match = String(semester?.id ?? "").match(/^(\d{4})-(\d+)$/);

  if (match) {
    return Number(match[1]) * 100 + Number(match[2]);
  }

  const preparedAt = Date.parse(semester?.preparedAt ?? "");
  return Number.isNaN(preparedAt) ? 0 : preparedAt;
}

export function findLatestSemester(semesters = []) {
  const activeSemesters = semesters.filter((semester) => semester?.active);
  const candidates = activeSemesters.length > 0 ? activeSemesters : semesters;

  return [...candidates].sort(
    (first, second) =>
      semesterSortValue(second) - semesterSortValue(first),
  )[0] ?? null;
}
