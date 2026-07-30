import { apiFetch } from "./client";

const DAY_INDEX = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
};

const COURSE_COLORS = ["#E7C332", "#75C6A8", "#F09A86", "#78A7E8", "#B997E8"];

function appendParam(searchParams, key, value) {
  const values = Array.isArray(value) ? value : [value];
  values
    .filter((item) => item !== undefined && item !== null && item !== "")
    .forEach((item) => searchParams.append(key, String(item)));
}

function minutesFromTime(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function mapSessionToBlock(session) {
  const day = DAY_INDEX[session.dayOfWeek];
  const startMinutes = minutesFromTime(session.startTime);
  const endMinutes = minutesFromTime(session.endTime);

  if (
    day === undefined ||
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    return null;
  }

  const gridStart = 9 * 60;
  const gridEnd = 19 * 60;
  const clippedStart = Math.max(startMinutes, gridStart);
  const clippedEnd = Math.min(endMinutes, gridEnd);

  if (clippedEnd <= clippedStart) return null;

  return {
    day,
    start: (clippedStart - gridStart) / 60,
    span: (clippedEnd - clippedStart) / 60,
    room: session.roomLabel || session.roomCode || "",
  };
}

function colorForSection(section) {
  const key = `${section.courseCode}-${section.sectionCode}`;
  const hash = [...key].reduce((total, character) => total + character.charCodeAt(0), 0);
  return COURSE_COLORS[hash % COURSE_COLORS.length];
}

function formatCredits(credits) {
  const numericCredits = Number(credits);
  if (!Number.isFinite(numericCredits)) return null;
  return Number.isInteger(numericCredits)
    ? String(numericCredits)
    : String(numericCredits).replace(/\.0+$/, "");
}

export function mapSectionToCourse(section) {
  const credits = formatCredits(section.credits);
  const identifier = `${section.courseCode}-${section.sectionCode}`;
  const meta = [
    section.completionCategory,
    section.targetGrade,
    credits ? `${credits}학점` : null,
    identifier,
  ]
    .filter(Boolean)
    .join("　");

  return {
    id: `${section.semesterId}:${section.courseCode}:${section.sectionCode}`,
    semesterId: section.semesterId,
    courseCode: section.courseCode,
    sectionCode: section.sectionCode,
    name: section.courseName,
    professor: section.professor || "교수 미정",
    time: section.timeToBeAnnounced
      ? "시간 미정"
      : section.rawLectureTime || "시간 정보 없음",
    room: section.rawLocation || "강의실 정보 없음",
    meta,
    note: section.notes || "없음",
    category: section.category,
    completionCategory: section.completionCategory,
    targetGrade: section.targetGrade,
    credits: section.credits,
    ratingAverage: section.ratingAverage,
    reviewCount: section.reviewCount,
    blocks: (section.sessions ?? []).map(mapSessionToBlock).filter(Boolean),
    color: colorForSection(section),
  };
}

export async function getSections(
  {
    semesterId,
    query,
    category,
    academicUnitCode,
    collegeCode,
    completionCategory,
    targetGrade,
    preferredAcademicUnitCode,
    professor,
    credits,
    day,
    sort = "DEFAULT",
    page = 0,
    size = 20,
  },
  signal,
) {
  const searchParams = new URLSearchParams();
  appendParam(searchParams, "semesterId", semesterId);
  appendParam(searchParams, "query", query);
  appendParam(searchParams, "category", category);
  appendParam(searchParams, "academicUnitCode", academicUnitCode);
  appendParam(searchParams, "collegeCode", collegeCode);
  appendParam(searchParams, "completionCategory", completionCategory);
  appendParam(searchParams, "targetGrade", targetGrade);
  appendParam(
    searchParams,
    "preferredAcademicUnitCode",
    preferredAcademicUnitCode,
  );
  appendParam(searchParams, "professor", professor);
  appendParam(searchParams, "credits", credits);
  appendParam(searchParams, "day", day);
  appendParam(searchParams, "sort", sort);
  appendParam(searchParams, "page", page);
  appendParam(searchParams, "size", size);

  const data = await apiFetch(`/api/v1/sections?${searchParams.toString()}`, {
    signal,
  });

  return {
    ...data,
    items: (data?.items ?? []).map(mapSectionToCourse),
  };
}

export async function getAllSections(params, signal) {
  const sections = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const result = await getSections(
      {
        ...params,
        page,
        size: 100,
      },
      signal,
    );

    sections.push(...(result?.items ?? []));
    totalPages = Math.max(1, Number(result?.totalPages) || 1);
    page += 1;
  }

  return sections;
}
