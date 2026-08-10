import { apiFetch } from "./client";

function queryString({ semesterId, page = 0, size = 20 } = {}) {
  const searchParams = new URLSearchParams();
  if (semesterId) searchParams.set("semesterId", semesterId);
  searchParams.set("page", String(page));
  searchParams.set("size", String(size));
  return searchParams.toString();
}

export function getCourseReviews(
  courseCode,
  { semesterId, page = 0, size = 20 } = {},
  signal,
) {
  return apiFetch(
    `/api/v1/courses/reviews/${encodeURIComponent(courseCode)}?${queryString({
      semesterId,
      page,
      size,
    })}`,
    { signal },
  );
}

export function createReview(
  { semesterId, courseCode, professor, rating, content },
  signal,
) {
  return apiFetch("/api/v1/reviews", {
    method: "POST",
    body: JSON.stringify({
      semesterId,
      courseCode,
      professor: professor || null,
      rating,
      content,
    }),
    signal,
  });
}
