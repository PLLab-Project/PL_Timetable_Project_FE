import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/client";
import { getSections } from "../api/sections";

function messageForError(error) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "강의 서버에 연결할 수 없습니다. API 주소와 CORS 설정을 확인해주세요.";
  }

  return "강의 목록을 불러오는 중 문제가 발생했습니다.";
}

function mergeUniqueCourses(current, incoming) {
  const coursesById = new Map(current.map((course) => [course.id, course]));
  incoming.forEach((course) => coursesById.set(course.id, course));
  return [...coursesById.values()];
}

export function useSectionCourses(params, { enabled = true } = {}) {
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const activeRequestId = useRef(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    const requestId = activeRequestId.current + 1;
    activeRequestId.current = requestId;

    if (!enabled) {
      setCourses([]);
      setPage(0);
      setTotalPages(0);
      setTotalElements(0);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      return undefined;
    }

    const controller = new AbortController();
    setCourses([]);
    setPage(0);
    setTotalPages(0);
    setTotalElements(0);
    setLoading(true);
    setLoadingMore(false);
    setError(null);

    getSections({ ...params, page: 0 }, controller.signal)
      .then((result) => {
        if (activeRequestId.current !== requestId) return;
        setCourses(result.items);
        setPage(result.page ?? 0);
        setTotalPages(result.totalPages ?? 0);
        setTotalElements(result.totalElements ?? 0);
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        if (activeRequestId.current !== requestId) return;
        setError(messageForError(requestError));
      })
      .finally(() => {
        if (activeRequestId.current === requestId) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [enabled, paramsKey, refreshIndex]);

  const loadMore = useCallback(async () => {
    if (!enabled || loading || loadingMore || page + 1 >= totalPages) return;

    const requestId = activeRequestId.current;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const result = await getSections({ ...params, page: nextPage });
      if (activeRequestId.current !== requestId) return;
      setCourses((current) => mergeUniqueCourses(current, result.items));
      setPage(result.page ?? nextPage);
      setTotalPages(result.totalPages ?? totalPages);
      setTotalElements(result.totalElements ?? totalElements);
    } catch (requestError) {
      if (activeRequestId.current !== requestId) return;
      setError(messageForError(requestError));
    } finally {
      if (activeRequestId.current === requestId) {
        setLoadingMore(false);
      }
    }
  }, [
    enabled,
    loading,
    loadingMore,
    page,
    paramsKey,
    totalElements,
    totalPages,
  ]);

  return {
    courses,
    error,
    hasMore: page + 1 < totalPages,
    loadMore,
    loading,
    loadingMore,
    retry: () => setRefreshIndex((current) => current + 1),
    totalElements,
  };
}
