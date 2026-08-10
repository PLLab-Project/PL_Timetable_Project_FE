import { apiFetch } from "./client";

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
};

const COURSE_COLORS = ["#E7C332", "#75C6A8", "#F09A86", "#78A7E8", "#B997E8"];

function minutesFromTime(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function formatTime(value) {
  return String(value ?? "").slice(0, 5);
}

function formatCredits(value) {
  const credits = Number(value);
  if (!Number.isFinite(credits)) return null;
  return Number.isInteger(credits) ? String(credits) : String(credits);
}

function colorForSection(section) {
  const key = `${section.courseCode}-${section.sectionCode}`;
  const hash = [...key].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return COURSE_COLORS[hash % COURSE_COLORS.length];
}

function mapMeetingToBlock(meeting) {
  const day = DAY_INDEX[meeting.dayOfWeek];
  const startMinutes = minutesFromTime(meeting.startTime);
  const endMinutes = minutesFromTime(meeting.endTime);

  if (
    day === undefined ||
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    return null;
  }

  const clippedStart = Math.max(startMinutes, 9 * 60);
  const clippedEnd = endMinutes;
  if (clippedEnd <= clippedStart) return null;

  return {
    day,
    start: (clippedStart - 9 * 60) / 60,
    span: (clippedEnd - clippedStart) / 60,
    room: "",
  };
}

function mapTimetableCourse(section, sourceCourses = []) {
  const sourceCourse = sourceCourses.find(
    (course) =>
      course.courseCode === section.courseCode &&
      course.sectionCode === section.sectionCode,
  );
  const blocks = (section.meetings ?? [])
    .map(mapMeetingToBlock)
    .filter(Boolean)
    .map((block) => ({
      ...block,
      room: sourceCourse?.room ?? "",
    }));
  const credits = formatCredits(section.credits);
  const identifier = `${section.courseCode}-${section.sectionCode}`;

  return {
    ...sourceCourse,
    id: `${section.semesterId}:${section.courseCode}:${section.sectionCode}`,
    timetableCourseId: section.id,
    semesterId: section.semesterId,
    courseCode: section.courseCode,
    sectionCode: section.sectionCode,
    name: section.courseName,
    professor: section.professorName || sourceCourse?.professor || "교수 미정",
    time:
      section.meetings?.length > 0
        ? section.meetings
            .map(
              (meeting) =>
                `${DAY_LABELS[meeting.dayOfWeek] ?? meeting.dayOfWeek} ${formatTime(
                  meeting.startTime,
                )}-${formatTime(meeting.endTime)}`,
            )
            .join(", ")
        : sourceCourse?.time || "시간 정보 없음",
    room: sourceCourse?.room || "강의실 정보 없음",
    meta:
      sourceCourse?.meta ||
      [credits ? `${credits}학점` : null, identifier]
        .filter(Boolean)
        .join("　"),
    note: sourceCourse?.note || "없음",
    credits: section.credits,
    blocks,
    day: blocks[0]?.day,
    start: blocks[0]?.start,
    span: blocks[0]?.span,
    color: sourceCourse?.color || colorForSection(section),
  };
}

export function mapTimetableResponse(timetable, sourceCourses = []) {
  return {
    id: `server-${timetable.id}`,
    serverId: timetable.id,
    name: timetable.name,
    semesterId: timetable.semesterId,
    totalCredits: timetable.totalCredits,
    favorite: Boolean(timetable.favorite),
    courses: (timetable.sections ?? []).map((section) =>
      mapTimetableCourse(section, sourceCourses),
    ),
  };
}

export function getTimetables(signal) {
  return apiFetch("/api/v1/timetables", { signal });
}

export function getTimetable(timetableId, signal) {
  return apiFetch(`/api/v1/timetables/${timetableId}`, { signal });
}

export function createTimetable(
  { name, semesterId, sections = [] },
  signal,
) {
  return apiFetch("/api/v1/timetables", {
    method: "POST",
    body: JSON.stringify({
      name,
      semesterId,
      sections,
    }),
    signal,
  });
}

export function replaceTimetableSections(timetableId, sections, signal) {
  return apiFetch(`/api/v1/timetables/${timetableId}/sections`, {
    method: "PATCH",
    body: JSON.stringify({ sections }),
    signal,
  });
}

export function updateTimetable(timetableId, name, signal) {
  return apiFetch(`/api/v1/timetables/${timetableId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
    signal,
  });
}

export function deleteTimetable(timetableId, signal) {
  return apiFetch(`/api/v1/timetables/${timetableId}`, {
    method: "DELETE",
    signal,
  });
}

export function updateTimetableFavorite(timetableId, favorite, signal) {
  return apiFetch(`/api/v1/timetables/${timetableId}/favorite`, {
    method: "PATCH",
    body: JSON.stringify({ favorite }),
    signal,
  });
}
