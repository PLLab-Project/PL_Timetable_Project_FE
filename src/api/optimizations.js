import { ApiError, apiFetch } from "./client";

const TERMINAL_STATUSES = new Set([
  "SUCCESS",
  "FAILED",
  "TIMEOUT",
  "CANCELLED",
]);

const DAY_INDEX = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
};

const DAY_LABELS = {
  MONDAY: "월",
  TUESDAY: "화",
  WEDNESDAY: "수",
  THURSDAY: "목",
  FRIDAY: "금",
  SATURDAY: "토",
  SUNDAY: "일",
};

const COURSE_COLORS = ["#E7C332", "#75C6A8", "#F09A86", "#78A7E8", "#B997E8"];

function sectionKey(course) {
  return `${course?.courseCode ?? ""}:${course?.sectionCode ?? ""}`;
}

function minutesFromTime(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function formatTime(value) {
  if (!value) return "";
  return value.slice(0, 5);
}

function mapSlotToBlock(slot, sourceCourse) {
  const day = DAY_INDEX[slot.dayOfWeek];
  const startMinutes = minutesFromTime(slot.startTime);
  const endMinutes = minutesFromTime(slot.endTime);

  if (
    day === undefined ||
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    return null;
  }

  const gridStart = 9 * 60;
  const clippedStart = Math.max(startMinutes, gridStart);
  const clippedEnd = endMinutes;

  if (clippedEnd <= clippedStart) return null;

  return {
    day,
    start: (clippedStart - gridStart) / 60,
    span: (clippedEnd - clippedStart) / 60,
    room: sourceCourse?.room ?? "",
  };
}

function colorForSection(courseCode, sectionCode) {
  const key = `${courseCode}-${sectionCode}`;
  const hash = [...key].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return COURSE_COLORS[hash % COURSE_COLORS.length];
}

function formatCredits(value) {
  const credits = Number(value);
  if (!Number.isFinite(credits)) return "";
  return Number.isInteger(credits) ? String(credits) : String(credits);
}

function formatSlots(slots) {
  return slots
    .map(
      (slot) =>
        `${DAY_LABELS[slot.dayOfWeek] ?? slot.dayOfWeek} ${formatTime(
          slot.startTime,
        )}-${formatTime(slot.endTime)}`,
    )
    .join(", ");
}

export function createOptimizationJob(payload, signal) {
  return apiFetch("/api/v1/optimizations", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

export function getOptimizationJob(jobId, signal) {
  return apiFetch(`/api/v1/optimizations/${jobId}`, { signal });
}

export function applyOptimizationResult(jobId, rank, signal) {
  return apiFetch(
    `/api/v1/optimizations/${jobId}/results/${rank}/apply`,
    {
      method: "POST",
      signal,
    },
  );
}

function abortableDelay(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds);

    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("요청이 취소되었습니다.", "AbortError"));
      },
      { once: true },
    );
  });
}

export async function waitForOptimizationJob(
  jobId,
  { signal, interval = 800, timeout = 45000 } = {},
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const job = await getOptimizationJob(jobId, signal);

    if (TERMINAL_STATUSES.has(job?.status)) {
      return job;
    }

    await abortableDelay(interval, signal);
  }

  throw new ApiError(
    408,
    "OPTIMIZATION_CLIENT_TIMEOUT",
    "자동편성 결과를 기다리는 시간이 초과되었습니다.",
  );
}

export function mapOptimizationSections(
  slots,
  { sourceCourses = [], lockedCourseKeys = new Set() } = {},
) {
  const sourcesByKey = new Map(
    sourceCourses
      .filter((course) => course.courseCode && course.sectionCode)
      .map((course) => [sectionKey(course), course]),
  );
  const groupedSlots = new Map();

  (slots ?? []).forEach((slot) => {
    const key = sectionKey(slot);
    const current = groupedSlots.get(key) ?? [];
    current.push(slot);
    groupedSlots.set(key, current);
  });

  return [...groupedSlots.entries()].map(([key, courseSlots]) => {
    const firstSlot = courseSlots[0];
    const sourceCourse = sourcesByKey.get(key);
    const credits = formatCredits(firstSlot.credits);
    const identifier = `${firstSlot.courseCode}-${firstSlot.sectionCode}`;

    return {
      ...sourceCourse,
      id: `${firstSlot.semesterId}:${firstSlot.courseCode}:${firstSlot.sectionCode}`,
      semesterId: firstSlot.semesterId,
      courseCode: firstSlot.courseCode,
      sectionCode: firstSlot.sectionCode,
      name: firstSlot.courseName,
      professor: firstSlot.professorName || sourceCourse?.professor || "교수 미정",
      time: sourceCourse?.time || formatSlots(courseSlots),
      room: sourceCourse?.room || "강의실 정보 없음",
      meta:
        sourceCourse?.meta ||
        [credits ? `${credits}학점` : null, identifier]
          .filter(Boolean)
          .join("　"),
      note: sourceCourse?.note || "없음",
      credits: firstSlot.credits,
      blocks: courseSlots
        .map((slot) => mapSlotToBlock(slot, sourceCourse))
        .filter(Boolean),
      color:
        sourceCourse?.color ||
        colorForSection(firstSlot.courseCode, firstSlot.sectionCode),
      locked: lockedCourseKeys.has(key),
    };
  });
}
