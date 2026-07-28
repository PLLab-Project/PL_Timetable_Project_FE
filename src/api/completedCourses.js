import { apiFetch } from "./client";

export function getCompletedCourses(signal) {
  return apiFetch("/api/v1/completed-courses", { signal });
}

export function createCompletedCourse(course, signal) {
  return apiFetch("/api/v1/completed-courses", {
    method: "POST",
    body: JSON.stringify(course),
    signal,
  });
}

export function updateCompletedCourse(completedCourseId, course, signal) {
  return apiFetch(`/api/v1/completed-courses/${completedCourseId}`, {
    method: "PATCH",
    body: JSON.stringify(course),
    signal,
  });
}

export function deleteCompletedCourse(completedCourseId, signal) {
  return apiFetch(`/api/v1/completed-courses/${completedCourseId}`, {
    method: "DELETE",
    signal,
  });
}
