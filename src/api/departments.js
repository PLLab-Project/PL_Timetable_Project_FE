import { apiFetch } from "./client";

function appendMultiParam(searchParams, key, value) {
  const values = Array.isArray(value) ? value : [value];
  values
    .filter((item) => item !== undefined && item !== null && item !== "")
    .forEach((item) => searchParams.append(key, String(item)));
}

export async function getDepartments(
  { query, collegeCode, currentOnly = true, page = 0, size = 20 } = {},
  signal,
) {
  const searchParams = new URLSearchParams();

  if (query?.trim()) searchParams.set("query", query.trim());
  appendMultiParam(searchParams, "collegeCode", collegeCode);
  searchParams.set("currentOnly", String(currentOnly));
  searchParams.set("page", String(page));
  searchParams.set("size", String(size));

  return apiFetch(`/api/v1/departments?${searchParams.toString()}`, {
    signal,
  });
}

export async function getAllDepartments(
  { currentOnly = true, collegeCode } = {},
  signal,
) {
  const departments = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const result = await getDepartments(
      {
        currentOnly,
        collegeCode,
        page,
        size: 100,
      },
      signal,
    );

    departments.push(...(result?.items ?? []));
    totalPages = Math.max(1, Number(result?.totalPages) || 1);
    page += 1;
  }

  return departments;
}

export function getColleges({ currentOnly = true } = {}, signal) {
  const searchParams = new URLSearchParams({
    currentOnly: String(currentOnly),
  });

  return apiFetch(
    `/api/v1/departments/colleges?${searchParams.toString()}`,
    { signal },
  );
}
