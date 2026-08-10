export const TIMETABLE_START_HOUR = 9;
export const DEFAULT_TIMETABLE_END_HOUR = 19;
export const TIMETABLE_DAY_HEADER_HEIGHT = 14;
export const TIMETABLE_MOBILE_HOUR_HEIGHT = 42.8;

const MAX_TIMETABLE_END_HOUR = 24;

function courseBlocks(course) {
  if (course?.blocks?.length) return course.blocks;
  if (
    Number.isFinite(course?.day) &&
    Number.isFinite(course?.start) &&
    Number.isFinite(course?.span)
  ) {
    return [course];
  }
  return [];
}

export function getTimetableEndHour(courses = [], timeSelections = []) {
  let latestEndHour = DEFAULT_TIMETABLE_END_HOUR;

  courses.filter(Boolean).forEach((course) => {
    courseBlocks(course).forEach((block) => {
      const start = Number(block.start);
      const span = Number(block.span);
      if (!Number.isFinite(start) || !Number.isFinite(span) || span <= 0) return;

      latestEndHour = Math.max(
        latestEndHour,
        TIMETABLE_START_HOUR + start + span,
      );
    });
  });

  timeSelections.forEach((selection) => {
    const endSlot = Number(selection?.endSlot);
    if (!Number.isFinite(endSlot)) return;
    latestEndHour = Math.max(
      latestEndHour,
      TIMETABLE_START_HOUR + endSlot / 2,
    );
  });

  return Math.min(MAX_TIMETABLE_END_HOUR, Math.ceil(latestEndHour));
}

export function getTimetableHourLabels(endHour) {
  return Array.from(
    { length: Math.max(1, endHour - TIMETABLE_START_HOUR) },
    (_, index) => {
      const hour = TIMETABLE_START_HOUR + index;
      return String(hour % 12 || 12);
    },
  );
}

export function getTimetableVerticalStyle(start, span, rowCount) {
  const safeRows = Math.max(1, rowCount);
  const startRatio = Number(start) / safeRows;
  const spanRatio = Number(span) / safeRows;
  const startPercent = startRatio * 100;
  const spanPercent = spanRatio * 100;
  const startHeaderOffset = startRatio * TIMETABLE_DAY_HEADER_HEIGHT;
  const spanHeaderOffset = spanRatio * TIMETABLE_DAY_HEADER_HEIGHT;

  return {
    top: `calc(${TIMETABLE_DAY_HEADER_HEIGHT}px + ${startPercent}% - ${startHeaderOffset}px)`,
    height: `calc(${spanPercent}% - ${spanHeaderOffset}px)`,
  };
}
