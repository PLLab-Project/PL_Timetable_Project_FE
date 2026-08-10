import { apiFetch } from "./client";

function appendParam(searchParams, key, value) {
  if (value === undefined || value === null || value === "") return;
  searchParams.set(key, String(value));
}

function mapCourse(course) {
  return {
    id: `${course.semesterId}:${course.courseCode}`,
    semesterId: course.semesterId,
    courseCode: course.courseCode,
    name: course.name,
    category: course.category,
    credits: course.credits,
    sectionCount: course.sectionCount,
  };
}

export async function searchCourses(
  {
    semesterId,
    query,
    page = 0,
    size = 100,
  },
  signal,
) {
  const searchParams = new URLSearchParams();
  appendParam(searchParams, "semesterId", semesterId);
  appendParam(searchParams, "query", query);
  appendParam(searchParams, "page", page);
  appendParam(searchParams, "size", size);

  const data = await apiFetch(`/api/v1/courses?${searchParams.toString()}`, {
    signal,
  });

  return {
    ...data,
    items: (data?.items ?? []).map(mapCourse),
  };
}

export async function getAllCourses(params, signal) {
  const courses = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const result = await searchCourses(
      {
        ...params,
        page,
        size: 100,
      },
      signal,
    );

    courses.push(...(result?.items ?? []));
    totalPages = Math.max(1, Number(result?.totalPages) || 1);
    page += 1;
  }

  return courses;
}
