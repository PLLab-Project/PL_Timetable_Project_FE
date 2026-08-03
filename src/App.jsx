import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Circle,
  CircleHelp,
  Download,
  GraduationCap,
  ImagePlus,
  LayoutList,
  LoaderCircle,
  WandSparkles,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import BottomNavigation from "./components/BottomNavigation";
import FirstLoginTutorial from "./components/FirstLoginTutorial";
import MyPage from "./pages/MyPage";
import MyTimetableList from "./pages/MyTimeTableList";
import MyTimetableDetail from "./pages/MyTimetableDetail";
import MyFavoriteTimetableList from "./pages/MyFavoriteTimetableList";
import MyAccountInfo from "./pages/MyAccountInfo";
import LoginPage from "./pages/LoginPage";
import SignupInfoPage from "./pages/SignupInfoPage";
import { getAuthSession, getGoogleLoginUrl } from "./api/auth";
import { ApiError } from "./api/client";
import {
  createCompletedCourse,
  deleteCompletedCourse,
  getCompletedCourses,
  recognizeCompletedCourses,
  updateCompletedCourse,
} from "./api/completedCourses";
import { searchCourses } from "./api/courses";
import {
  getAllDepartments,
  getColleges,
} from "./api/departments";
import { getGraduationEvaluation } from "./api/graduation";
import {
  applyOptimizationResult,
  createOptimizationJob,
  waitForOptimizationJob,
} from "./api/optimizations";
import { getAllSections } from "./api/sections";
import { findLatestSemester, getSemesters } from "./api/semesters";
import {
  createTimetable,
  deleteTimetable as deleteServerTimetable,
  getTimetable,
  getTimetables,
  mapTimetableResponse,
  replaceTimetableSections,
  updateTimetableFavorite,
  updateTimetable as updateServerTimetable,
} from "./api/timetables";
import {
  getCurrentUser,
  updateCurrentUser,
  withdrawCurrentUser,
} from "./api/users";
import { useSectionCourses } from "./hooks/useSectionCourses";

const DAYS = ["월", "화", "수", "목", "금"];
const TIMES = ["9", "10", "11", "12", "1", "2", "3", "4", "5", "6"];
const COLORS = ["#F0C92D", "#75C6A8", "#F09A86", "#78A7E8", "#B997E8"];
const FALLBACK_SEMESTER_ID = "2026-2";
const COURSE_PAGE_SIZE = 20;
const TUTORIAL_STORAGE_PREFIX = "pl-timetable:tutorial-complete:v1";

function tutorialStorageKey(profile) {
  const identity =
    profile?.studentId ??
    profile?.studentNumber ??
    profile?.id;

  return identity
    ? `${TUTORIAL_STORAGE_PREFIX}:${encodeURIComponent(String(identity))}`
    : null;
}

function hasCompletedTutorial(profile) {
  if (profile?.tutorialCompleted === true) return true;

  const storageKey = tutorialStorageKey(profile);
  if (!storageKey) return false;

  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

function saveTutorialCompletion(profile) {
  const storageKey = tutorialStorageKey(profile);
  if (!storageKey) return;

  try {
    window.localStorage.setItem(storageKey, "true");
  } catch {
    // 저장소를 사용할 수 없는 환경에서는 현재 세션에서만 닫습니다.
  }
}

function mapUserProfile(profile, fallback = {}) {
  return {
    ...fallback,
    id: profile?.id ?? fallback.id,
    name: profile?.name ?? fallback.name ?? "",
    studentId:
      profile?.studentNumber ?? fallback.studentId ?? "",
    grade: profile?.grade ?? fallback.grade ?? 1,
    major: profile?.department ?? fallback.major ?? "",
    departmentCode:
      profile?.departmentId ?? fallback.departmentCode ?? "",
    collegeName: fallback.collegeName ?? "",
    admissionYear:
      profile?.admissionYear ?? fallback.admissionYear ?? null,
    studentType:
      profile?.studentType ?? fallback.studentType ?? "",
    programPath:
      profile?.programPath ?? fallback.programPath ?? "",
    profileCompleted:
      profile?.profileCompleted ?? fallback.profileCompleted ?? false,
    graduationProfileCompleted:
      profile?.graduationProfileCompleted ??
      fallback.graduationProfileCompleted ??
      false,
    tutorialCompleted:
      profile?.tutorialCompleted ?? fallback.tutorialCompleted ?? false,
  };
}

const DAY_API_VALUES = {
  월: "MONDAY",
  화: "TUESDAY",
  수: "WEDNESDAY",
  목: "THURSDAY",
  금: "FRIDAY",
};

const PREFERRED_TIME_RANGES = {
  오전: [9, 12],
  오후: [12, 18],
  저녁: [18, 22],
};

const SORT_API_VALUES = {
  "": "DEFAULT",
  기본순: "DEFAULT",
  인기순: "POPULARITY_DESC",
  이름순: "NAME_ASC",
};

const MAJOR_API_FILTERS = {
  교양필수: { completionCategory: "교필" },
  교직: { completionCategory: "교직" },
  일반선택: { completionCategory: "일선" },
  "인간과 소통": { category: "교양선택(제1영역:인간과소통)" },
  "사회와 경제": { category: "교양선택(제2영역:사회와경제)" },
  "과학과 기술": { category: "교양선택(제3영역:과학과기술)" },
  "예술과 문화": { category: "교양선택(제4영역:예술과문화)" },
  "융합과 혁신": { category: "교양선택(제5영역:융합과혁신)" },
  디지털리터러시: { category: "디지털리터러시" },
};

function getSectionKey(course) {
  if (!course?.courseCode || !course?.sectionCode) return null;
  return `${course.courseCode}:${course.sectionCode}`;
}

function mergeCoursesBySection(...courseGroups) {
  const coursesByKey = new Map();

  courseGroups.flat().forEach((course) => {
    const key = getSectionKey(course);
    if (key) coursesByKey.set(key, course);
  });

  return [...coursesByKey.values()];
}

function toTimetableSectionRequests(courses) {
  const sectionsByKey = new Map();

  courses.forEach((course) => {
    const key = getSectionKey(course);
    if (!key) return;

    sectionsByKey.set(key, {
      courseCode: course.courseCode,
      sectionCode: course.sectionCode,
    });
  });

  return [...sectionsByKey.values()];
}

function getAvailableTimes(preferredTimes) {
  const ranges = (preferredTimes?.length
    ? preferredTimes
        .map((time) => PREFERRED_TIME_RANGES[time])
        .filter(Boolean)
    : [[9, 22]])
    .map(([startHour, endHour]) => [startHour, endHour])
    .sort((first, second) => first[0] - second[0]);

  const mergedRanges = ranges.reduce((merged, range) => {
    const previous = merged[merged.length - 1];

    if (previous && range[0] <= previous[1]) {
      previous[1] = Math.max(previous[1], range[1]);
      return merged;
    }

    merged.push(range);
    return merged;
  }, []);

  return mergedRanges
    .map(([startHour, endHour]) => ({
      startTime: `${String(startHour).padStart(2, "0")}:00:00`,
      endTime: `${String(endHour).padStart(2, "0")}:00:00`,
    }));
}

function getOptimizationErrorMessage(error) {
  if (error?.name === "AbortError") {
    return null;
  }

  const message = error?.message ?? "";

  if (message.includes("제한 시간")) {
    return "후보 강의가 너무 많아 서버가 제한 시간 안에 계산하지 못했습니다. 학년 또는 교양 조건을 하나 이상 선택해 후보를 줄인 뒤 다시 시도해주세요.";
  }

  if (message.includes("조건에 맞는 시간표 조합")) {
    return "선택한 시간대·공강 요일·학점 조건을 모두 만족하는 조합이 없습니다. 시간대를 추가하거나 최소 학점을 낮춰주세요.";
  }

  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "백엔드 로그인 세션이 없습니다. 실제 로그인 API를 연결한 뒤 다시 시도해주세요.";
    }

    if (error.status === 403) {
      return "자동편성 요청 권한 또는 CSRF 인증을 확인해주세요.";
    }

    if (error.code === "REQUIRED_COURSE_CONFLICT") {
      return "고정한 강의끼리 시간이 겹칩니다. 고정을 일부 해제한 뒤 다시 시도해주세요.";
    }

    if (error.status === 409) {
      return "자동편성 결과를 서버 시간표에 저장하는 동안 강의 시간이 충돌했습니다. 조건을 확인한 뒤 다시 시도해주세요.";
    }

    if (
      error.status === 422 ||
      error.code === "NO_FEASIBLE_TIMETABLE"
    ) {
      return "선택한 조건을 모두 만족하는 시간표가 없습니다. 조건을 줄여서 다시 시도해주세요.";
    }

    return error.message || "자동편성 요청을 처리하지 못했습니다.";
  }

  if (error instanceof TypeError) {
    return "자동편성 서버에 연결할 수 없습니다. API 주소와 CORS 설정을 확인해주세요.";
  }

  return error?.message || "자동편성 중 문제가 발생했습니다.";
}

const initialCourses = [
  {
    id: 1,
    name: "프론트엔드 웹디자인",
    professor: "김정민",
    time: "수 09:30-11:30, 목 09:30-11:00",
    room: "A409-웹스토리지인실습실",
    meta: "전선　2학년　3학점　565017-01",
    note: "자격증(2학년) 우선수강/변경불가 14시 전체",
    day: 2,
    start: 0.5,
    span: 1.5,
    color: "#E7C332",
    previewDays: [2, 3],
  },
  {
    id: 2,
    name: "프론트엔드 웹디자인",
    professor: "김정민",
    time: "목 09:30-11:30, 금 09:30-11:00",
    room: "A409-웹스토리지인실습실",
    meta: "전선　2학년　3학점　565017-02",
    note: "자격증(2학년) 우선수강/변경불가 14시 전체",
    day: 3,
    start: 0.5,
    span: 1.5,
    color: "#E7C332",
    previewDays: [3, 4],
  },
  {
    id: 3,
    name: "피드 웹디자인",
    professor: "김정민",
    time: "수 13:00-15:00, 금 13:00-14:30",
    room: "A409-웹스토리지인실습실",
    meta: "전선　2학년　3학점　565017-03",
    note: "프로젝트 수업",
    day: 2,
    start: 4,
    span: 2,
  },
  {
    id: 4,
    name: "UX 디자인 기초",
    professor: "이수현",
    time: "화 11:00-13:00",
    room: "B201 디자인실",
    meta: "교선　1학년　2학점　510224-01",
    note: "노트북 지참",
    day: 1,
    start: 2,
    span: 2,
  },
  {
    id: 5,
    name: "디지털리터러시",
    professor: "박지훈",
    time: "월 14:00-16:00",
    room: "C301",
    meta: "교양　전체　2학점　420113-01",
    note: "온라인 병행",
    day: 0,
    start: 5,
    span: 2,
  },
  {
    id: 6,
    name: "웹 프로그래밍",
    professor: "최유진",
    time: "금 15:00-18:00",
    room: "A402",
    meta: "전필　2학년　3학점　565101-01",
    note: "실습 중심",
    day: 4,
    start: 6,
    span: 3,
  },
];

function createInitialTimetables(semesterId = FALLBACK_SEMESTER_ID) {
  return [
    {
      id: 1,
      name: "시간표 1",
      semesterId,
      favorite: false,
      courses: [],
    },
  ];
}

function getTimetableBlocks(course, preview = false) {
  if (course?.blocks?.length) return course.blocks;
  if (!course) return [];

  const days =
    preview && course.previewDays?.length
      ? course.previewDays
      : [course.day];

  return days
    .filter((day) => day !== undefined)
    .map((day) => ({
      day,
      start: course.start,
      span: course.span,
      room: course.room,
    }));
}

function canUseAsOptimizationCandidate(course) {
  return (
    Boolean(getSectionKey(course)) &&
    !course?.timeToBeAnnounced &&
    getTimetableBlocks(course).some(
      (block) =>
        Number.isInteger(block.day) &&
        Number.isFinite(block.start) &&
        Number.isFinite(block.span) &&
        block.span > 0,
    )
  );
}

function getConflictingCourses(course, selectedCourses) {
  const candidateBlocks = getTimetableBlocks(course);

  if (candidateBlocks.length === 0) return [];

  return selectedCourses.filter((selectedCourse) => {
    if (selectedCourse.id === course.id) return false;

    return getTimetableBlocks(selectedCourse).some((selectedBlock) =>
      candidateBlocks.some((candidateBlock) => {
        if (selectedBlock.day !== candidateBlock.day) return false;

        const selectedEnd = selectedBlock.start + selectedBlock.span;
        const candidateEnd = candidateBlock.start + candidateBlock.span;

        return (
          selectedBlock.start < candidateEnd &&
          candidateBlock.start < selectedEnd
        );
      }),
    );
  });
}

function timeCellKey(day, slot) {
  return `${day}:${slot}`;
}

function getTimeSelectionCells(selection) {
  const cells = [];

  for (let day = selection.dayStart; day <= selection.dayEnd; day += 1) {
    for (
      let slot = selection.startSlot;
      slot < selection.endSlot;
      slot += 1
    ) {
      cells.push({ day, slot });
    }
  }

  return cells;
}

function formatApiTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:00`;
}

function getBlockedTimes(timeSelections) {
  const cellsByDay = new Map();

  timeSelections.forEach((selection) => {
    selection.cells.forEach((cell) => {
      const slots = cellsByDay.get(cell.day) ?? new Set();
      slots.add(cell.slot);
      cellsByDay.set(cell.day, slots);
    });
  });

  const blockedTimes = [];

  cellsByDay.forEach((slotSet, day) => {
    const dayOfWeek = DAY_API_VALUES[DAYS[day]];
    if (!dayOfWeek) return;

    const slots = [...slotSet].sort((first, second) => first - second);
    let rangeStart = null;
    let previousSlot = null;

    const pushRange = () => {
      if (rangeStart === null || previousSlot === null) return;
      blockedTimes.push({
        dayOfWeek,
        startTime: formatApiTime(9 * 60 + rangeStart * 30),
        endTime: formatApiTime(9 * 60 + (previousSlot + 1) * 30),
      });
    };

    slots.forEach((slot) => {
      if (rangeStart === null) {
        rangeStart = slot;
        previousSlot = slot;
        return;
      }

      if (slot === previousSlot + 1) {
        previousSlot = slot;
        return;
      }

      pushRange();
      rangeStart = slot;
      previousSlot = slot;
    });

    pushRange();
  });

  return blockedTimes;
}

function courseOverlapsTimeSelections(course, timeSelections) {
  return getTimetableBlocks(course).some((block) => {
    const blockEnd = block.start + block.span;

    return timeSelections.some((selection) =>
      selection.cells.some((cell) => {
        const cellStart = cell.slot / 2;
        const cellEnd = cellStart + 0.5;

        return (
          block.day === cell.day &&
          block.start < cellEnd &&
          cellStart < blockEnd
        );
      }),
    );
  });
}

function courseMatchesTimeSelections(course, timeSelections) {
  return (
    timeSelections.length === 0 ||
    courseOverlapsTimeSelections(course, timeSelections)
  );
}

function drawTimetableText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const characters = [...String(text || "")];
  const lines = [];
  let currentLine = "";

  characters.forEach((character) => {
    const nextLine = `${currentLine}${character}`;
    if (context.measureText(nextLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = character;
      return;
    }
    currentLine = nextLine;
  });

  if (currentLine) lines.push(currentLine);

  lines.slice(0, maxLines).forEach((line, index) => {
    const isLastVisibleLine = index === maxLines - 1 && lines.length > maxLines;
    const output = isLastVisibleLine
      ? `${line.slice(0, Math.max(0, line.length - 1))}…`
      : line;
    context.fillText(output, x, y + index * lineHeight, maxWidth);
  });
}

function downloadTimetableImage(timetable) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  const width = 1200;
  const height = 1400;
  const margin = 60;
  const gridTop = 180;
  const gridWidth = width - margin * 2;
  const gridHeight = 1120;
  const timeColumnWidth = 58;
  const dayHeaderHeight = 58;
  const dayWidth = (gridWidth - timeColumnWidth) / 5;
  const hourHeight = (gridHeight - dayHeaderHeight) / 10;
  const days = ["월", "화", "수", "목", "금"];
  const times = ["9", "10", "11", "12", "1", "2", "3", "4", "5", "6"];

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#777777";
  context.font = "500 24px sans-serif";
  context.fillText(`${timetable.semesterId}학기`, margin, 60);
  context.fillStyle = "#111111";
  context.font = "700 44px sans-serif";
  context.fillText(timetable.name, margin, 115);

  context.strokeStyle = "#d9d9d9";
  context.lineWidth = 2;
  context.strokeRect(margin, gridTop, gridWidth, gridHeight);

  context.font = "500 20px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#888888";

  days.forEach((day, index) => {
    const x = margin + timeColumnWidth + index * dayWidth;
    context.fillText(
      day,
      x + dayWidth / 2,
      gridTop + dayHeaderHeight / 2,
    );
  });

  context.strokeStyle = "#e5e5e5";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(margin, gridTop + dayHeaderHeight);
  context.lineTo(margin + gridWidth, gridTop + dayHeaderHeight);

  for (let column = 0; column <= 5; column += 1) {
    const x = margin + timeColumnWidth + column * dayWidth;
    context.moveTo(x, gridTop);
    context.lineTo(x, gridTop + gridHeight);
  }

  times.forEach((time, row) => {
    const y = gridTop + dayHeaderHeight + row * hourHeight;
    if (row > 0) {
      context.moveTo(margin, y);
      context.lineTo(margin + gridWidth, y);
    }
    context.fillText(time, margin + timeColumnWidth / 2, y + 18);
  });
  context.stroke();

  context.textAlign = "left";
  context.textBaseline = "alphabetic";

  timetable.courses.forEach((course, courseIndex) => {
    getTimetableBlocks(course).forEach((block) => {
      if (block.day < 0 || block.day > 4) return;

      const x = margin + timeColumnWidth + block.day * dayWidth;
      const y =
        gridTop + dayHeaderHeight + numericCredit(block.start) * hourHeight;
      const blockHeight = Math.max(2, numericCredit(block.span) * hourHeight);

      context.fillStyle =
        course.color || COLORS[courseIndex % COLORS.length];
      context.fillRect(x, y, dayWidth, blockHeight);
      context.strokeStyle = "#ffffff";
      context.lineWidth = 2;
      context.strokeRect(x, y, dayWidth, blockHeight);

      context.save();
      context.beginPath();
      context.rect(x + 8, y + 8, dayWidth - 16, blockHeight - 16);
      context.clip();

      context.fillStyle = "#ffffff";
      context.font = "700 22px sans-serif";
      drawTimetableText(
        context,
        course.name,
        x + 12,
        y + 30,
        dayWidth - 24,
        26,
        2,
      );
      context.font = "500 18px sans-serif";
      context.fillText(course.professor || "", x + 12, y + 82, dayWidth - 24);
      context.font = "400 16px sans-serif";
      drawTimetableText(
        context,
        block.room || course.room || "",
        x + 12,
        y + 108,
        dayWidth - 24,
        20,
        2,
      );
      context.restore();
    });
  });

  const safeName =
    timetable.name.replace(/[\\/:*?"<>|]/g, "_").trim() || "시간표";
  const downloadLink = document.createElement("a");
  downloadLink.href = canvas.toDataURL("image/png");
  downloadLink.download = `${safeName}.png`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

function Timetable({
  selectedCourses,
  activeCourse,
  focusedCourseId,
  onCourseClick,
  onToggleCourseLock,
  timeSelections,
  onAddTimeSelection,
  onRemoveTimeSelection,
  onToggleTimeSelectionLock,
  onTimeSelectionStart,
}) {
  const previewBlocks = getTimetableBlocks(activeCourse, true);
  const [draftSelection, setDraftSelection] = useState(null);
  const dragSelectionRef = useRef(null);
  const suppressCourseClickRef = useRef(false);
  const longPressDuration = 550;

  const getGridPoint = (event, gridElement) => {
    const rect = gridElement.getBoundingClientRect();
    const timeColumnWidth = 13;
    const dayHeaderHeight = 14;
    const contentX = event.clientX - rect.left - timeColumnWidth;
    const contentY = event.clientY - rect.top - dayHeaderHeight;

    if (contentX < 0 || contentY < 0) return null;

    const dayWidth = (rect.width - timeColumnWidth) / 5;
    const slotHeight = (rect.height - dayHeaderHeight) / 20;

    return {
      day: Math.max(0, Math.min(4, Math.floor(contentX / dayWidth))),
      slot: Math.max(0, Math.min(19, Math.floor(contentY / slotHeight))),
    };
  };

  const buildTimeSelection = (origin, current) => ({
    dayStart: Math.min(origin.day, current.day),
    dayEnd: Math.max(origin.day, current.day),
    startSlot: Math.min(origin.slot, current.slot),
    endSlot: Math.max(origin.slot, current.slot) + 1,
  });

  const selectionStyle = (selection) => {
    const start = selection.startSlot / 2;
    const span = (selection.endSlot - selection.startSlot) / 2;

    return {
      left: `calc(13px + ${selection.dayStart} * ((100% - 13px) / 5))`,
      top: `calc(14px + ${start * 10}% - ${start * 1.4}px)`,
      width: `calc(${selection.dayEnd - selection.dayStart + 1} * ((100% - 13px) / 5))`,
      height: `calc(${span * 10}% - ${span * 1.4}px)`,
    };
  };

  const selectionCellStyle = (cell, locked) => {
    const start = cell.slot / 2;

    return {
      left: `calc(13px + ${cell.day} * ((100% - 13px) / 5))`,
      top: `calc(14px + ${start * 10}% - ${start * 1.4}px)`,
      width: "calc((100% - 13px) / 5)",
      height: "calc(5% - 0.7px)",
      boxSizing: "border-box",
      backgroundColor: locked
        ? "rgba(118, 84, 232, 0.13)"
        : "rgba(118, 84, 232, 0.18)",
      backgroundImage: "none",
      border: "none",
    };
  };

  const clearLongPressTimer = (drag) => {
    if (drag && drag.longPressTimer !== null) {
      window.clearTimeout(drag.longPressTimer);
      drag.longPressTimer = null;
    }
  };

  useEffect(
    () => () => clearLongPressTimer(dragSelectionRef.current),
    [],
  );

  const resetDragSelection = (event) => {
    clearLongPressTimer(dragSelectionRef.current);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragSelectionRef.current = null;
    setDraftSelection(null);
  };

  const handleGridPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const point = getGridPoint(event, event.currentTarget);
    if (!point) return;

    const startedOnCourse = Boolean(
      event.target.closest?.(".timetable-course-block"),
    );
    const courseId =
      event.target.closest?.(".timetable-course-block")?.dataset.courseId ??
      null;
    const selectedRange = timeSelections.find((selection) =>
      selection.cells.some(
        (cell) => cell.day === point.day && cell.slot === point.slot,
      ),
    );
    const longPressTarget = courseId
      ? { type: "course", id: courseId }
      : selectedRange
        ? { type: "time", id: selectedRange.id }
        : null;

    if (!startedOnCourse) {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    dragSelectionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: point,
      moved: false,
      startedOnCourse,
      longPressTarget,
      longPressTimer: null,
      longPressTriggered: false,
    };
    const drag = dragSelectionRef.current;

    if (longPressTarget) {
      drag.longPressTimer = window.setTimeout(() => {
        if (
          dragSelectionRef.current !== drag ||
          drag.moved ||
          drag.longPressTriggered
        ) {
          return;
        }

        drag.longPressTriggered = true;
        suppressCourseClickRef.current = true;
        setDraftSelection(null);

        if (longPressTarget.type === "course") {
          onToggleCourseLock(longPressTarget.id);
        } else {
          onToggleTimeSelectionLock(longPressTarget.id);
        }
      }, longPressDuration);
    }

    setDraftSelection(buildTimeSelection(point, point));
    onTimeSelectionStart();
  };

  const handleGridPointerMove = (event) => {
    const drag = dragSelectionRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4
    ) {
      drag.moved = true;
      clearLongPressTimer(drag);
      if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }
    }

    const point = getGridPoint(event, event.currentTarget);
    if (!point) return;

    event.preventDefault();
    setDraftSelection(buildTimeSelection(drag.origin, point));
  };

  const handleGridPointerUp = (event) => {
    const drag = dragSelectionRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const point =
      getGridPoint(event, event.currentTarget) ?? drag.origin;
    clearLongPressTimer(drag);

    if (drag.longPressTriggered) {
      suppressCourseClickRef.current = true;
    } else if (drag.moved) {
      onAddTimeSelection(buildTimeSelection(drag.origin, point));
      suppressCourseClickRef.current = true;
    } else {
      const selectedRange = timeSelections.find(
        (selection) =>
          selection.cells.some(
            (cell) => cell.day === point.day && cell.slot === point.slot,
          ),
      );

      if (selectedRange) {
        if (!selectedRange.locked) {
          onRemoveTimeSelection(selectedRange.id);
        }
        suppressCourseClickRef.current = true;
      }
    }

    resetDragSelection(event);
    window.setTimeout(() => {
      suppressCourseClickRef.current = false;
    }, 0);
  };

  const handleGridContextMenu = (event) => {
    event.preventDefault();

    if (suppressCourseClickRef.current) return;

    const courseId =
      event.target.closest?.(".timetable-course-block")?.dataset.courseId ??
      null;

    if (courseId) {
      onToggleCourseLock(courseId);
      return;
    }

    const point = getGridPoint(event, event.currentTarget);
    if (!point) return;

    const selectedRange = timeSelections.find((selection) =>
      selection.cells.some(
        (cell) => cell.day === point.day && cell.slot === point.slot,
      ),
    );

    if (selectedRange) {
      onToggleTimeSelectionLock(selectedRange.id);
    }
  };

  return (
    <div
      className="timetable-grid relative mt-2 h-[442px] touch-none select-none overflow-hidden rounded-[15px] border border-[#d9d9d9] bg-white"
      onPointerDown={handleGridPointerDown}
      onPointerMove={handleGridPointerMove}
      onPointerUp={handleGridPointerUp}
      onPointerCancel={resetDragSelection}
      onContextMenu={handleGridContextMenu}
    >
      <div className="grid h-full grid-cols-[13px_repeat(5,1fr)] grid-rows-[14px_repeat(10,minmax(0,1fr))]">
        <div className="border-b border-[#dedede]" />
        {DAYS.map((day) => (
          <div key={day} className="border-b border-l border-[#dedede] text-center text-[10px] leading-[13px] text-[#999]">
            {day}
          </div>
        ))}
        {TIMES.map((time, row) => (
          <div key={time} className="contents">
            <div className={`${row === 0 ? "" : "border-t"} border-[#ededed] pr-0.5 pt-1 text-right text-[9px] text-[#999]`}>
              {time}
            </div>
            {DAYS.map((day) => (
              <div
                key={`${time}-${day}`}
                className={`border-l ${row === 0 ? "" : "border-t"} border-[#ededed]`}
              />
            ))}
          </div>
        ))}
      </div>
      {selectedCourses.flatMap((course, courseIndex) =>
        getTimetableBlocks(course).map((block, blockIndex) => {
          const focused = focusedCourseId === course.id;
          const locked = Boolean(course.locked);
          const baseColor = focused
            ? "#f1edff"
            : course.color || COLORS[courseIndex % COLORS.length];

          return (
            <button
              type="button"
              key={`${course.id}-${blockIndex}`}
              aria-label={`${course.name} 강의 정보 보기 ${blockIndex + 1}`}
              data-course-id={String(course.id)}
              data-course-locked={locked ? "true" : "false"}
              onClick={(event) => {
                if (suppressCourseClickRef.current) {
                  event.preventDefault();
                  return;
                }
                onCourseClick(course);
              }}
              className={`timetable-course-block absolute flex appearance-none flex-col items-stretch justify-start overflow-hidden border-0 p-[2px] text-left text-[8px] font-medium leading-[1.15] shadow-[inset_0_0_0_0.5px_#fff] ${
                focused ? "text-[#555]" : "text-white"
              }`}
              style={{
                background: locked
                  ? `repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.46) 0 1px, transparent 1px 8px), ${baseColor}`
                  : baseColor,
                left: `calc(13px + ${block.day} * ((100% - 13px) / 5))`,
                top: `calc(14px + ${block.start * 10}% - ${block.start * 1.4}px)`,
                width: "calc((100% - 13px) / 5)",
                height: `calc(${block.span * 10}% - ${block.span * 1.4}px)`,
              }}
            >
              <p className="timetable-course-title line-clamp-2 text-[9px] font-bold leading-[1.15]">{course.name}</p>
              <p className="timetable-course-professor mt-[3px]">{course.professor}</p>
              <p className="timetable-course-room mt-[2px] break-all text-[8px] leading-[1.15]">
                {block.room || course.room}
              </p>
            </button>
          );
        }),
      )}
      {timeSelections.map((selection) => {
        return (
          <div
            key={selection.id}
            data-time-selection={selection.id}
            data-time-selection-locked={selection.locked ? "true" : "false"}
            className="contents"
          >
            {selection.cells.map((cell) => (
              <div
                key={timeCellKey(cell.day, cell.slot)}
                data-time-selection-cell
                className="pointer-events-none absolute z-[5]"
                style={selectionCellStyle(cell, selection.locked)}
              />
            ))}
            {selection.locked && (
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute z-[6] overflow-visible"
                style={{
                  left: "13px",
                  top: "14px",
                  width: "calc(100% - 13px)",
                  height: "calc(100% - 14px)",
                }}
              >
                <defs>
                  <pattern
                    id={`locked-time-pattern-${selection.id}`}
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M-2 2L2-2M0 8L8 0M6 10L10 6"
                      fill="none"
                      stroke="rgba(118, 84, 232, 0.42)"
                      strokeWidth="0.8"
                    />
                  </pattern>
                </defs>
                {selection.cells.map((cell) => (
                  <rect
                    key={`pattern-${timeCellKey(cell.day, cell.slot)}`}
                    x={`${cell.day * 20}%`}
                    y={`${cell.slot * 5}%`}
                    width="20%"
                    height="5%"
                    fill={`url(#locked-time-pattern-${selection.id})`}
                  />
                ))}
              </svg>
            )}
          </div>
        );
      })}
      {draftSelection && (
        <div
          data-time-selection-draft
          className="pointer-events-none absolute z-20 shadow-[inset_0_0_0_1px_#7654e8]"
          style={{
            ...selectionStyle(draftSelection),
            backgroundColor: "rgba(118, 84, 232, 0.24)",
          }}
        />
      )}
      {activeCourse &&
        previewBlocks.map((block, blockIndex) => (
          <div
            key={`preview-${activeCourse.id}-${blockIndex}`}
            className="absolute z-10 shadow-[inset_0_0_0_0.5px_#fff]"
            style={{
              backgroundColor: "rgba(118, 84, 232, 0.25)",
              left: `calc(13px + ${block.day} * ((100% - 13px) / 5))`,
              top: `calc(14px + ${block.start * 10}% - ${block.start * 1.4}px)`,
              width: "calc((100% - 13px) / 5)",
              height: `calc(${block.span * 10}% - ${block.span * 1.4}px)`,
            }}
          />
        ))}
    </div>
  );
}

function CourseCard({
  course,
  active,
  selected,
  removable = false,
  onClick,
  onAdd,
  onRemove,
}) {
  return (
    <article
      onClick={onClick}
      className={`flex h-[76px] cursor-pointer flex-col justify-center overflow-hidden rounded-[14px] border px-[9px] py-[6px] transition ${
        active
          ? "border-transparent bg-[#f7f4ff] shadow-[0_2px_3px_rgba(0,0,0,0.10)]"
          : "border-[#e1e1e1] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[12px] font-bold leading-[14px]">{course.name}</h3>
          <p className="mt-0.5 text-[10px] font-medium leading-[11px]">{course.professor}</p>
        </div>
        {removable ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            className="flex shrink-0 items-center gap-0.5 text-[9px] font-semibold text-brand"
          >
            <Trash2 size={11} /> 삭제
          </button>
        ) : active && !selected ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAdd();
            }}
            className="shrink-0 text-[9px] font-bold text-brand"
          >
            + 시간표에 추가
          </button>
        ) : selected ? (
          <span className="shrink-0 text-[9px] font-semibold text-brand">추가됨</span>
        ) : null}
      </div>
      <p className="mt-0.5 truncate text-[9px] leading-[10px] text-[#aaa]">{course.time}</p>
      <p className="truncate text-[9px] leading-[10px] text-[#aaa]">강의 {course.room}</p>
      <div className="mt-0.5 flex items-end justify-between gap-2">
        <p className="truncate text-[9px] leading-[10px] text-[#aaa]">{course.meta}</p>
        <p className={`max-w-[52%] truncate text-[9px] leading-[10px] ${active ? "text-brand" : "text-[#aaa]"}`}>
          비고: {course.note}
        </p>
      </div>
    </article>
  );
}

function TimetableSheet({
  items,
  activeTimetableId,
  onAdd,
  onSelect,
  onRename,
  onDelete,
  onToggleFavorite,
  onDownload,
  onClose,
}) {
  const [closing, setClosing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const closeTimer = useRef(null);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 260);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const startRename = (item) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const finishRename = (item) => {
    const nextName = editingName.trim();
    if (nextName && nextName !== item.name) {
      onRename(item.id, nextName);
    }
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div
      className={`timetable-list-overlay absolute inset-0 z-40 bg-black/30 ${
        closing ? "animate-timetable-backdrop-out" : "animate-timetable-backdrop"
      }`}
      onClick={handleClose}
    >
      <section
        className={`rounded-b-[16px] bg-white px-[14px] pb-4 pt-[10px] shadow-lg ${
          closing ? "animate-timetable-sheet-out" : "animate-timetable-sheet"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-[#a7a7a7]">2026-2학기</p>
            <button className="flex items-center gap-1 text-[17px] font-bold" onClick={handleClose}>
              시간표 목록 <ChevronUp size={13} strokeWidth={2.5} />
            </button>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 text-[13px] text-[#777]"
          >
            <Plus size={15} /> 시간표 추가
          </button>
        </div>

        {items.length === 0 && (
          <p className="border-t border-[#eee] py-6 text-center text-[11px] text-[#999]">
            시간표가 없습니다. 새 시간표를 추가해주세요.
          </p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="flex h-[37px] items-center border-t border-[#eee]"
          >
            <button
              type="button"
              onClick={() => onToggleFavorite(item.id)}
              aria-label={`${item.name} 즐겨찾기 ${
                item.favorite ? "해제" : "추가"
              }`}
            >
              <Star
                size={14}
                className={
                  item.favorite
                    ? "fill-[#f6c900] text-[#f6c900]"
                    : "text-[#bbb]"
                }
              />
            </button>

            {editingId === item.id ? (
              <div className="ml-2 flex min-w-0 flex-1 items-center gap-1">
                <input
                  autoFocus
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") finishRename(item);
                    if (event.key === "Escape") {
                      setEditingId(null);
                      setEditingName("");
                    }
                  }}
                  maxLength={120}
                  aria-label={`${item.name} 새 이름`}
                  className="h-[27px] min-w-0 flex-1 border-b border-brand bg-transparent text-[12px] font-semibold outline-none"
                />
                <button
                  type="button"
                  onClick={() => finishRename(item)}
                  aria-label="시간표 이름 저장"
                  className="text-brand"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={`ml-2 min-w-0 flex-1 truncate text-left text-[12px] font-semibold ${
                  activeTimetableId === item.id ? "text-brand" : ""
                }`}
                onClick={() => {
                  onSelect(item.id);
                  handleClose();
                }}
              >
                {item.name}
              </button>
            )}

            <div className="flex gap-3 text-[#999]">
              <button
                type="button"
                onClick={() => onDownload(item)}
                aria-label={`${item.name} 이미지 다운로드`}
              >
                <Download size={14} />
              </button>
              <button
                type="button"
                onClick={() => startRename(item)}
                aria-label={`${item.name} 이름 수정`}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                aria-label={`${item.name} 삭제`}
                onClick={() => setDeleteTarget(item)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </section>

      {deleteTarget && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/25 px-8"
          onClick={(event) => event.stopPropagation()}
        >
          <section className="w-full max-w-[300px] rounded-[15px] bg-white px-5 pb-4 pt-5 text-center shadow-lg">
            <h2 className="text-[14px] font-bold">시간표를 삭제하시겠습니까?</h2>
            <p className="mt-2 truncate text-[11px] text-[#888]">
              {deleteTarget.name}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-[36px] rounded-[10px] border border-[#ddd] text-[12px] text-[#777]"
              >
                아니오
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="h-[36px] rounded-[10px] bg-brand text-[12px] font-semibold text-white"
              >
                예
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Popover({
  title,
  items,
  onSelect,
  onClose,
  onBack = onClose,
  selectedItems = [],
  top = 324,
  anchor = null,
}) {
  return (
    <div className="absolute inset-0 z-30" onClick={onClose}>
      <section
        className="absolute left-1/2 w-[214px] -translate-x-1/2 overflow-hidden rounded-[15px] bg-[rgba(205,203,208,0.82)] text-center shadow-sm backdrop-blur-[2px]"
        style={
          anchor
            ? { top: anchor.top, left: anchor.left, transform: "none" }
            : { top }
        }
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center gap-1 px-3 py-3 text-left text-[12px] font-semibold text-white"
        >
          <ChevronLeft size={15} /> {title}
        </button>
        <div className="no-scrollbar max-h-[360px] overflow-y-auto">
          {items.map((item) => (
            <button
              key={item}
              onClick={() => onSelect(item)}
              className={`block w-full border-t border-white/20 py-2 text-[11px] ${
                selectedItems.includes(item)
                  ? "font-semibold text-brand"
                  : ""
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function AutoSchedulePanel({ onClose, onGenerate }) {
  const [days, setDays] = useState([]);
  const [times, setTimes] = useState([]);
  const [liberals, setLiberals] = useState([]);
  const [grades, setGrades] = useState([]);
  const [minCredits, setMinCredits] = useState(12);
  const [maxCredits, setMaxCredits] = useState(22);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(null);

  const closePanel = (afterClose = onClose) => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(afterClose, 280);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const toggleGrade = (grade) => {
    setGrades((current) =>
      current.includes(grade)
        ? current.filter((value) => value !== grade)
        : [...current, grade],
    );
  };

  const toggleChoice = (setter, value) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const creditPercent = (value) => ((value - 12) / 10) * 100;

  const choiceClass = (selected) =>
    `flex h-[37px] items-center justify-center rounded-full border text-[11px] transition ${
      selected
        ? "border-brand bg-white font-medium text-[#222] ring-1 ring-brand"
        : "border-[#e5e5e5] bg-white text-[#444]"
    }`;

  return (
    <div
      className={`condition-panel-overlay absolute inset-0 z-[60] bg-black/30 ${
        closing ? "animate-timetable-backdrop-out" : "animate-timetable-backdrop"
      }`}
      onClick={() => closePanel()}
    >
      <aside
        className={`condition-panel-drawer absolute bottom-0 right-0 top-0 flex w-[330px] flex-col rounded-l-[17px] bg-white px-[14px] pb-7 pt-6 ${
          closing ? "animate-condition-panel-out" : "animate-condition-panel"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#ededed] pb-3">
          <h2 className="text-[17px] font-bold">조건 설정</h2>
          <button aria-label="조건 설정 닫기" onClick={() => closePanel()} className="text-[#999]">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-3 space-y-5">
          <fieldset>
            <legend className="mb-2 text-[12px] font-medium">공강 희망 요일</legend>
            <div className="grid grid-cols-5 gap-2">
              {DAYS.map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => toggleChoice(setDays, value)}
                  className={choiceClass(days.includes(value))}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium">선호 시간대</legend>
            <div className="grid grid-cols-3 gap-2">
              {["오전", "오후", "저녁"].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => toggleChoice(setTimes, value)}
                  className={choiceClass(times.includes(value))}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-[12px] font-medium">학점 설정</legend>
            <div className="px-1">
              <div className="relative h-5">
                <div className="absolute left-0 right-0 top-[7px] h-[5px] rounded-full bg-[#ececef]" />
                <div
                  className="absolute top-[7px] h-[5px] bg-brand"
                  style={{
                    left: `${creditPercent(minCredits)}%`,
                    right: `${100 - creditPercent(maxCredits)}%`,
                  }}
                />
                <input
                  aria-label="최소 학점"
                  className="credit-range"
                  type="range"
                  min="12"
                  max="22"
                  step="1"
                  value={minCredits}
                  onChange={(event) =>
                    setMinCredits(Math.min(Number(event.target.value), maxCredits))
                  }
                />
                <input
                  aria-label="최대 학점"
                  className="credit-range"
                  type="range"
                  min="12"
                  max="22"
                  step="1"
                  value={maxCredits}
                  onChange={(event) =>
                    setMaxCredits(Math.max(Number(event.target.value), minCredits))
                  }
                />
              </div>
              <div className="relative h-4 text-[10px] text-[#666]">
                <span
                  className={`absolute ${
                    minCredits === 12 ? "translate-x-0" : "-translate-x-1/2"
                  }`}
                  style={{ left: `${creditPercent(minCredits)}%` }}
                >
                  {minCredits}
                </span>
                <span
                  className={`absolute ${
                    maxCredits === 22 ? "-translate-x-full" : "-translate-x-1/2"
                  }`}
                  style={{ left: `${creditPercent(maxCredits)}%` }}
                >
                  {maxCredits}
                </span>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium">교양 선택</legend>
            <div className="grid grid-cols-3 gap-2">
              {["인간과 소통", "사회와 경제", "과학과 기술", "예술과 문화", "융합과 혁신", "디지털리터러시"].map(
                (value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => toggleChoice(setLiberals, value)}
                    className={choiceClass(liberals.includes(value))}
                  >
                    {value}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-[12px] font-medium">전공과목 학년 선택</legend>
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((grade) => {
                const checked = grades.includes(grade);
                return (
                  <button
                    type="button"
                    key={grade}
                    onClick={() => toggleGrade(grade)}
                    className="flex items-center gap-1.5 text-[11px]"
                  >
                    <span
                      className={`flex h-[12px] w-[12px] items-center justify-center rounded-full border ${
                        checked ? "border-brand" : "border-[#ddd]"
                      }`}
                    >
                      {checked && <span className="h-[7px] w-[7px] rounded-full bg-brand" />}
                    </span>
                    {grade}학년
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <button
          type="button"
          onClick={() =>
            closePanel(() =>
              onGenerate({
                days,
                times,
                liberals,
                grades,
                minCredits,
                maxCredits,
              }),
            )
          }
          className="mt-auto h-[49px] w-full rounded-full bg-brand text-[15px] font-bold text-white"
        >
          이 조건으로 편성하기
        </button>
      </aside>
    </div>
  );
}

const courseAreaOptions = [
  "전공필수",
  "전공선택",
  "교양필수",
  "교양선택",
  "일반선택",
  "교직",
];

const courseLiberalAreaOptions = [
  "인간과 소통",
  "사회와 경제",
  "과학과 기술",
  "예술과 문화",
  "융합과 혁신",
  "디지털리터러시",
];

const courseCreditOptions = ["P/N", "1학점", "2학점", "3학점", "4학점"];

function formatCourseCredits(value) {
  const numericCredits = Number(value);
  if (!Number.isFinite(numericCredits)) return "";
  const formatted = Number.isInteger(numericCredits)
    ? String(numericCredits)
    : String(numericCredits).replace(/\.0+$/, "");
  return `${formatted}학점`;
}

function inferCourseArea(category = "", completionCategory = "") {
  const trimmedCategory = String(category ?? "").trim();
  const normalizedCategory = trimmedCategory.replace(/\s/g, "");

  if (courseLiberalAreaOptions.includes(trimmedCategory)) {
    return trimmedCategory;
  }

  if (trimmedCategory.includes("제1영역")) return "인간과 소통";
  if (trimmedCategory.includes("제2영역")) return "사회와 경제";
  if (trimmedCategory.includes("제3영역")) return "과학과 기술";
  if (trimmedCategory.includes("제4영역")) return "예술과 문화";
  if (trimmedCategory.includes("제5영역")) return "융합과 혁신";
  if (trimmedCategory.includes("제6영역")) return "디지털리터러시";

  const normalizedCompletionCategory = String(
    completionCategory ?? "",
  ).replace(/\s/g, "");
  if (
    normalizedCategory === "전필" ||
    normalizedCategory === "전공필수" ||
    normalizedCompletionCategory === "전필" ||
    normalizedCompletionCategory === "전공필수"
  ) {
    return "전공필수";
  }
  if (
    normalizedCategory === "전선" ||
    normalizedCategory === "전공선택" ||
    normalizedCompletionCategory === "전선" ||
    normalizedCompletionCategory === "전공선택"
  ) {
    return "전공선택";
  }

  if (trimmedCategory.includes("교양필수") || trimmedCategory === "교필") {
    return "교양필수";
  }
  if (trimmedCategory.includes("교양선택") || trimmedCategory === "교선") {
    return "교양선택";
  }
  if (trimmedCategory.includes("일반선택") || trimmedCategory === "일선") {
    return "일반선택";
  }
  if (trimmedCategory.includes("교직")) return "교직";
  return "";
}

function normalizeAcademicUnitName(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\s()/·ㆍ_-]/g, "")
    .toLocaleLowerCase("ko-KR");
}

function categoryBelongsToUserMajor(category, userMajorName) {
  const normalizedCategory = normalizeAcademicUnitName(category);
  const normalizedMajor = normalizeAcademicUnitName(userMajorName);
  const majorBaseName = normalizedMajor.replace(/(?:학과|전공)$/, "");

  return Boolean(
    normalizedCategory &&
      normalizedMajor &&
      (normalizedCategory.includes(normalizedMajor) ||
        (majorBaseName.length >= 2 &&
          normalizedCategory.includes(majorBaseName))),
  );
}

function isMajorArea(value) {
  const normalized = String(value ?? "").replace(/\s/g, "");
  return ["전필", "전선", "전공필수", "전공선택"].includes(normalized);
}

function resolveCourseAreaForUser(
  section,
  preferredAcademicUnitCode,
  userMajorName,
) {
  const classifications = section?.classifications ?? [];
  const ownClassification = preferredAcademicUnitCode
    ? classifications.find(
        (classification) =>
          classification.academicUnitCode === preferredAcademicUnitCode,
      )
    : null;
  const ownArea = inferCourseArea(
    section?.category,
    ownClassification?.completionCategory,
  );
  if (ownClassification && ownArea) return ownArea;

  const categoryArea = inferCourseArea(section?.category);
  const hasMajorClassification = classifications.some((classification) =>
    isMajorArea(classification.completionCategory),
  );
  const normalizedCategory = String(section?.category ?? "").replace(
    /\s/g,
    "",
  );
  const isMajorCourse =
    hasMajorClassification ||
    isMajorArea(categoryArea) ||
    normalizedCategory.startsWith("전공");

  if (!isMajorCourse) return categoryArea;
  if (categoryBelongsToUserMajor(section?.category, userMajorName)) {
    return isMajorArea(categoryArea) ? categoryArea : "전공선택";
  }
  if (preferredAcademicUnitCode || userMajorName) return "일반선택";

  return categoryArea;
}

function findPreferredSection(
  sections,
  predicate,
  preferredAcademicUnitCode,
) {
  const matchedSections = sections.filter(predicate);
  if (!preferredAcademicUnitCode) return matchedSections[0];

  return (
    matchedSections.find((section) =>
      section.classifications?.some(
        (classification) =>
          classification.academicUnitCode === preferredAcademicUnitCode,
      ),
    ) ?? matchedSections[0]
  );
}

function CourseInputForm({
  initial,
  semesterId,
  preferredAcademicUnitCode,
  userMajorName,
  onSave,
  onCancel,
}) {
  const [name, setName] = useState(initial?.name || "");
  const [area, setArea] = useState(initial?.area || "");
  const [credits, setCredits] = useState(initial?.credits || "");
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(() =>
    initial?.name ? { name: initial.name } : null,
  );
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showLiberalAreas, setShowLiberalAreas] = useState(
    courseLiberalAreaOptions.includes(initial?.area),
  );
  const courseSearchRef = useRef(null);
  const areaMenuRef = useRef(null);
  const creditsMenuRef = useRef(null);
  const searchRequestId = useRef(0);
  const areaRequestId = useRef(0);

  useEffect(() => {
    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    const normalizedName = name.trim();

    if (
      normalizedName.length < 2 ||
      selectedCourse?.name === normalizedName
    ) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return undefined;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      setSearchLoading(true);
      setSearchError("");
      setSearchOpen(true);

      searchCourses(
        {
          semesterId,
          query: normalizedName,
          size: 100,
        },
        controller.signal,
      )
        .then((result) => {
          if (searchRequestId.current !== requestId) return;
          setSearchResults(result.items);
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          if (searchRequestId.current !== requestId) return;
          setSearchResults([]);
          setSearchError("강의를 검색하지 못했습니다. 직접 입력할 수 있어요.");
        })
        .finally(() => {
          if (searchRequestId.current === requestId) {
            setSearchLoading(false);
          }
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [name, selectedCourse, semesterId]);

  useEffect(() => {
    if (!searchOpen) return undefined;

    const closeSearchOnOutsideClick = (event) => {
      if (
        courseSearchRef.current &&
        !courseSearchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeSearchOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeSearchOnOutsideClick);
  }, [searchOpen]);

  useEffect(() => {
    if (!openMenu) return undefined;

    const closeMenuOnOutsideClick = (event) => {
      const activeMenuRef =
        openMenu === "area" ? areaMenuRef.current : creditsMenuRef.current;

      if (activeMenuRef && !activeMenuRef.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("pointerdown", closeMenuOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeMenuOnOutsideClick);
  }, [openMenu]);

  return (
    <section className="relative rounded-[13px] border border-[#e5e5e5] px-4 pb-2.5 pt-3">
      <div ref={courseSearchRef} className="relative">
        <label className="block text-[10px] text-[#777]">과목명</label>
        <div className="flex h-[31px] items-center border-b border-[#ddd]">
          <input
            value={name}
            onChange={(event) => {
              areaRequestId.current += 1;
              setName(event.target.value);
              setSelectedCourse(null);
              setSearchResults([]);
              setSearchError("");
              setSearchOpen(false);
            }}
            onFocus={() => {
              if (searchLoading || searchResults.length > 0 || searchError) {
                setSearchOpen(true);
              }
            }}
            placeholder="과목명을 입력하세요"
            className="min-w-0 flex-1 text-[13px] outline-none placeholder:text-[#aaa]"
          />
          <Search
            size={12}
            className={searchLoading ? "animate-pulse text-brand" : "text-[#888]"}
          />
        </div>

        {searchOpen && name.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full z-40 max-h-[184px] overflow-y-auto border-x border-b border-[#d8d8d8] bg-white shadow-[0_3px_8px_rgba(0,0,0,0.08)]">
            {searchLoading && (
              <p className="px-2 py-3 text-center text-[11px] text-[#999]">
                강의를 검색하고 있어요.
              </p>
            )}

            {!searchLoading &&
              searchResults.map((course) => (
                <button
                  type="button"
                  key={course.id}
                  onClick={async () => {
                    const requestId = areaRequestId.current + 1;
                    areaRequestId.current = requestId;
                    const nextCredits = formatCourseCredits(course.credits);
                    const inferredArea = inferCourseArea(
                      course.category,
                      course.completionCategory,
                    );

                    setName(course.name);
                    setSelectedCourse(course);
                    if (nextCredits) setCredits(nextCredits);
                    if (inferredArea) {
                      setArea(inferredArea);
                      setShowLiberalAreas(
                        courseLiberalAreaOptions.includes(inferredArea),
                      );
                    } else {
                      setArea("");
                      setShowLiberalAreas(false);
                    }
                    setSearchResults([]);
                    setSearchError("");
                    setSearchOpen(false);

                    if (
                      !preferredAcademicUnitCode ||
                      !course.courseCode ||
                      !semesterId
                    ) {
                      return;
                    }

                    try {
                      const sections = await getAllSections({
                        semesterId,
                        query: course.courseCode,
                        preferredAcademicUnitCode,
                      });
                      const matchedSection = findPreferredSection(
                        sections,
                        (section) => section.courseCode === course.courseCode,
                        preferredAcademicUnitCode,
                      );
                      const resolvedArea = resolveCourseAreaForUser(
                        matchedSection ?? course,
                        preferredAcademicUnitCode,
                        userMajorName,
                      );

                      if (
                        areaRequestId.current === requestId &&
                        resolvedArea
                      ) {
                        setArea(resolvedArea);
                        setShowLiberalAreas(
                          courseLiberalAreaOptions.includes(resolvedArea),
                        );
                      }
                    } catch {
                      // 학과별 이수구분 조회 실패 시 과목 기본 분류를 유지합니다.
                    }
                  }}
                  className="block w-full border-b border-[#ededed] px-2 py-2 text-left last:border-b-0 hover:bg-[#f5f5f5]"
                >
                  <span className="block truncate text-[12px] font-medium text-[#222]">
                    {course.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-[#999]">
                    {course.courseCode}
                    {course.category ? ` · ${course.category}` : ""}
                    {course.credits !== null &&
                    course.credits !== undefined
                      ? ` · ${formatCourseCredits(course.credits)}`
                      : ""}
                  </span>
                </button>
              ))}

            {!searchLoading && searchError && (
              <p className="px-2 py-3 text-center text-[11px] text-[#d26b5f]">
                {searchError}
              </p>
            )}

            {!searchLoading &&
              !searchError &&
              searchResults.length === 0 && (
                <p className="px-2 py-3 text-center text-[11px] text-[#999]">
                  검색 결과가 없습니다. 직접 입력할 수 있어요.
                </p>
              )}
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-5">
        <div ref={areaMenuRef} className="relative">
          <p className="text-[10px] text-[#777]">영역</p>
          <button
            type="button"
            onClick={() => {
              if (openMenu === "area") {
                setOpenMenu(null);
                return;
              }
              setShowLiberalAreas(courseLiberalAreaOptions.includes(area));
              setOpenMenu("area");
            }}
            className={`flex h-[29px] w-full items-center justify-between border-b border-[#ddd] text-[13px] ${
              area ? "text-[#222]" : "text-[#999]"
            }`}
          >
            {area || "영역 선택"}
            {openMenu === "area" ? (
              <ChevronUp size={10} />
            ) : (
              <ChevronDown size={10} />
            )}
          </button>
          {openMenu === "area" && (
            <div className="absolute left-0 top-full z-30 max-h-[320px] w-full overflow-y-auto border-x border-b border-[#d8d8d8] bg-white">
              {courseAreaOptions.map((option) => (
                <Fragment key={option}>
                  <button
                    type="button"
                    onClick={() => {
                      if (option === "교양선택") {
                        setShowLiberalAreas((current) => !current);
                        return;
                      }
                      setArea(option);
                      setOpenMenu(null);
                    }}
                    className={`flex w-full items-center justify-between px-1.5 py-1.5 text-left text-[12px] ${
                      option === "교양선택" && showLiberalAreas
                        ? "bg-white font-medium text-[#555] hover:bg-white"
                        : area === option
                          ? "font-medium text-[#222] hover:bg-[#f7f7f7]"
                          : "text-[#999] hover:bg-[#f7f7f7]"
                    }`}
                  >
                    <span>{option}</span>
                    {option === "교양선택" &&
                      (showLiberalAreas ? (
                        <ChevronUp size={10} />
                      ) : (
                        <ChevronDown size={10} />
                      ))}
                  </button>
                  {option === "교양선택" && showLiberalAreas && (
                    <div className="bg-[#f3f3f3]">
                      {courseLiberalAreaOptions.map((liberalArea) => (
                        <button
                          type="button"
                          key={liberalArea}
                          onClick={() => {
                            setArea(liberalArea);
                            setOpenMenu(null);
                          }}
                          className={`block w-full py-1.5 pl-3 pr-1.5 text-left text-[12px] hover:bg-[#e8e8e8] ${
                            area === liberalArea
                              ? "font-medium text-[#222]"
                              : "text-[#999]"
                          }`}
                        >
                          {liberalArea}
                        </button>
                      ))}
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>
        <div ref={creditsMenuRef} className="relative">
          <p className="text-[10px] text-[#777]">학점</p>
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === "credits" ? null : "credits")}
            className={`flex h-[29px] w-full items-center justify-between border-b border-[#ddd] text-[13px] ${
              credits ? "text-[#222]" : "text-[#999]"
            }`}
          >
            {credits || "학점 선택"}
            {openMenu === "credits" ? (
              <ChevronUp size={10} />
            ) : (
              <ChevronDown size={10} />
            )}
          </button>
          {openMenu === "credits" && (
            <div className="absolute left-0 top-full z-30 w-full border-x border-b border-[#d8d8d8] bg-white">
              {courseCreditOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => {
                    setCredits(option);
                    setOpenMenu(null);
                  }}
                  className={`block w-full px-1.5 py-1.5 text-left text-[12px] hover:bg-[#f7f7f7] ${
                    credits === option
                      ? "font-medium text-[#222]"
                      : "text-[#999]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="h-[31px] rounded-[11px] border border-[#e5e5e5] px-5 text-[12px] text-[#aaa]"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() =>
            name.trim() &&
            onSave({
              name: name.trim(),
              area,
              credits,
              gradingBasis: credits === "P/N" ? "PASS_FAIL" : "LETTER",
              gradeValue: credits === "P/N" ? "P" : null,
              actualCredits:
                credits === "P/N"
                  ? selectedCourse?.credits ?? initial?.actualCredits ?? 0
                  : null,
              courseCode:
                selectedCourse?.courseCode ?? initial?.courseCode ?? null,
              semesterId:
                selectedCourse?.semesterId ?? initial?.semesterId ?? null,
              sourceCategory:
                selectedCourse?.category ?? initial?.sourceCategory ?? null,
            })
          }
          className="h-[31px] rounded-[11px] bg-brand px-5 text-[12px] font-semibold text-white"
        >
          저장
        </button>
      </div>
    </section>
  );
}

function numericCredit(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function displayCredit(value) {
  const numericValue = numericCredit(value);
  return Number.isInteger(numericValue)
    ? String(numericValue)
    : String(numericValue).replace(/\.0+$/, "");
}

function progressPercentage(completed, required) {
  const requiredCredits = numericCredit(required);
  if (requiredCredits <= 0) return 0;
  return Math.min(
    100,
    Math.max(0, (numericCredit(completed) / requiredCredits) * 100),
  );
}

function graduationErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.code === "AUTH_SESSION_EXPIRED") {
      return "현재 임시 로그인은 백엔드 로그인 세션을 만들지 않습니다. 학교 이메일 OTP 로그인 연결 후 졸업요건을 확인할 수 있습니다.";
    }

    if (error.status === 400 || error.code === "INVALID_ACADEMIC_QUERY") {
      return "졸업판정에 필요한 입학연도, 학생 구분, 전공 방식 정보가 없습니다. 사용자 프로필 API에 해당 정보가 먼저 저장되어야 합니다.";
    }

    return error.message;
  }

  return "졸업요건 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
}

function GraduationProgress({ label, completed, required, detail }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-semibold">
        <span>
          {label}
          {detail && (
            <span className="ml-1 font-normal text-[#999]">{detail}</span>
          )}
        </span>
        <span>
          {displayCredit(completed)}/{displayCredit(required)} 학점
        </span>
      </div>
      <div className="mt-1 h-[5px] overflow-hidden rounded-full bg-[#ececee]">
        <div
          className="h-full rounded-full bg-brand transition-[width]"
          style={{ width: `${progressPercentage(completed, required)}%` }}
        />
      </div>
    </div>
  );
}

function GraduationModal({ semesterId, onClose }) {
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryIndex, setRetryIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    getGraduationEvaluation(
      { semesterId },
      controller.signal,
    )
      .then(setEvaluation)
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        setEvaluation(null);
        setError(graduationErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [retryIndex, semesterId]);

  const rule = evaluation?.rule ?? {};
  const completed = evaluation?.completedCredits ?? {};
  const requiredCredits = rule.credits ?? {};
  const liberalRequirements = rule.liberalArts ?? {};

  const majorMinimum =
    numericCredit(requiredCredits.primaryMajor) ||
    numericCredit(requiredCredits.majorFoundation) +
      numericCredit(requiredCredits.majorRequired) +
      numericCredit(requiredCredits.majorElective);
  const majorCompleted =
    numericCredit(completed.primaryMajor) ||
    numericCredit(completed.majorFoundation) +
      numericCredit(completed.majorRequired) +
      numericCredit(completed.majorElective);
  const liberalMinimum =
    numericCredit(liberalRequirements.totalMinimum) ||
    numericCredit(liberalRequirements.required) +
      numericCredit(liberalRequirements.elective);
  const liberalCompleted =
    numericCredit(completed.liberalTotal) ||
    numericCredit(completed.liberalRequired) +
      numericCredit(completed.liberalElective);

  const detailRows = [
    {
      label: "전공기초",
      completed: completed.majorFoundation,
      required: requiredCredits.majorFoundation,
    },
    {
      label: "전공필수",
      completed: completed.majorRequired,
      required: requiredCredits.majorRequired,
    },
    {
      label: "전공선택",
      completed: completed.majorElective,
      required: requiredCredits.majorElective,
    },
    {
      label: "교양필수",
      completed: completed.liberalRequired,
      required: liberalRequirements.required,
    },
    {
      label: "교양선택",
      completed: completed.liberalElective,
      required: liberalRequirements.elective,
    },
  ].filter((item) => numericCredit(item.required) > 0);

  const remainingItems = [
    ...(evaluation?.creditGaps ?? []).map((gap) => ({
      key: `credit-${gap.code}`,
      text: `${gap.label} ${displayCredit(gap.missing)}학점`,
    })),
    ...(evaluation?.areaGaps ?? []).map((gap) => ({
      key: `area-${gap.area}`,
      text: `${gap.area} ${
        numericCredit(gap.missingCourses) > 0
          ? `${gap.missingCourses}과목`
          : `${displayCredit(gap.missingCredits)}학점`
      }`,
    })),
    ...(evaluation?.requiredCourseGaps ?? []).map((gap, index) => ({
      key: `course-${gap.course?.courseCode ?? index}`,
      text: gap.course?.courseName
        ? `필수과목 ${gap.course.courseName}`
        : "필수과목 이수 필요",
    })),
  ];

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
      onClick={onClose}
    >
      <section
        className="w-full max-w-[354px] overflow-hidden rounded-[15px] bg-white px-6 pb-3 pt-7 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="max-h-[66dvh] overflow-y-auto">
          {loading && (
            <div className="flex min-h-[220px] items-center justify-center text-[12px] text-[#999]">
              졸업요건을 확인하고 있어요.
            </div>
          )}

          {!loading && error && (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <GraduationCap size={28} className="text-brand" />
              <h2 className="mt-3 text-[14px] font-bold">
                졸업요건을 확인할 수 없습니다
              </h2>
              <p className="mt-2 break-keep text-[11px] leading-5 text-[#888]">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setRetryIndex((current) => current + 1)}
                className="mt-4 rounded-[10px] border border-brand px-4 py-2 text-[11px] font-semibold text-brand"
              >
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && evaluation && (
            <>
              <div className="flex items-center justify-between text-[13px] font-bold">
                <span>전체</span>
                <span>
                  {displayCredit(completed.total)} /{" "}
                  {displayCredit(requiredCredits.total)} 학점
                </span>
              </div>
              <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-[#ececee]">
                <div
                  className="h-full rounded-full bg-brand transition-[width]"
                  style={{
                    width: `${progressPercentage(
                      completed.total,
                      requiredCredits.total,
                    )}%`,
                  }}
                />
              </div>

              <div className="ml-1 mt-3 space-y-3 border-l-2 border-[#e7e7e7] pl-3">
                {majorMinimum > 0 && (
                  <GraduationProgress
                    label="전공"
                    completed={majorCompleted}
                    required={majorMinimum}
                    detail={`(최소 ${displayCredit(majorMinimum)}학점)`}
                  />
                )}

                {liberalMinimum > 0 && (
                  <GraduationProgress
                    label="교양"
                    completed={liberalCompleted}
                    required={liberalMinimum}
                    detail={
                      numericCredit(liberalRequirements.totalMaximum) > 0
                        ? `(최대 ${displayCredit(
                            liberalRequirements.totalMaximum,
                          )}학점 인정)`
                        : `(최소 ${displayCredit(liberalMinimum)}학점)`
                    }
                  />
                )}

                {detailRows.length > 0 && (
                  <div className="space-y-2 text-[10px]">
                    {detailRows.map((item) => (
                      <p
                        key={item.label}
                        className="flex items-center justify-between"
                      >
                        <span>{item.label}</span>
                        <span>
                          {displayCredit(item.completed)}/
                          {displayCredit(item.required)} 학점
                        </span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-7 text-[10px]">
                <h3 className="mb-3 text-[12px] font-bold">
                  남은 졸업요건
                </h3>
                {remainingItems.length > 0 ? (
                  <div className="space-y-3">
                    {remainingItems.map((item) => (
                      <p key={item.key}>· {item.text}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#777]">
                    {evaluation.automaticRequirementsSatisfied
                      ? "자동 판정 가능한 졸업요건을 모두 충족했습니다."
                      : "표시할 부족 요건이 없습니다."}
                  </p>
                )}
              </div>

              {(evaluation.nonAutomaticItems?.length > 0 ||
                evaluation.warnings?.length > 0) && (
                <div className="mt-5 rounded-[10px] bg-[#faf8ff] p-3 text-[9px] leading-4 text-[#777]">
                  <h3 className="mb-1 text-[10px] font-semibold text-[#555]">
                    추가 확인 필요
                  </h3>
                  {evaluation.nonAutomaticItems?.map((item) => (
                    <p key={item.code}>· {item.title}</p>
                  ))}
                  {evaluation.warnings?.map((warning) => (
                    <p key={warning.code}>· {warning.message}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full border-t border-[#eee] py-3 text-[15px] font-semibold text-brand"
        >
          확인
        </button>
      </section>
    </div>
  );
}

function mapCompletedCourse(course) {
  const credits = Number(course.credits);
  const creditLabel =
    Number.isFinite(credits)
      ? `${Number.isInteger(credits) ? credits : String(credits)}학점`
      : "학점 미입력";

  return {
    id: course.id,
    name: course.courseName,
    area: course.area || course.category || "영역 미선택",
    credits: course.gradingBasis === "PASS_FAIL" ? "P/N" : creditLabel,
    actualCredits: Number.isFinite(credits) ? credits : 0,
    courseCode: course.courseCode,
    semesterId: course.semester,
    sourceCategory: course.category,
    status: course.status,
    inputSource: course.inputSource,
    gradingBasis: course.gradingBasis || "LETTER",
    gradeValue: course.gradeValue || "",
  };
}

function mapRecognizedCourseToDraftInitial(course, fallbackSemesterId) {
  const hasRecognizedCredits =
    course?.credits !== null &&
    course?.credits !== undefined &&
    course?.credits !== "";
  const recognizedCredits = hasRecognizedCredits
    ? Number(course.credits)
    : Number.NaN;
  const gradingBasis = course?.gradingBasis || "LETTER";
  const inferredArea =
    inferCourseArea(course?.area) ||
    inferCourseArea(course?.category, course?.category);

  return {
    name: String(course?.courseName ?? "").trim(),
    area: inferredArea,
    credits:
      gradingBasis === "PASS_FAIL"
        ? "P/N"
        : hasRecognizedCredits
          ? formatCourseCredits(course.credits)
          : "",
    actualCredits: Number.isFinite(recognizedCredits)
      ? recognizedCredits
      : 0,
    courseCode: null,
    semesterId: course?.semester || fallbackSemesterId || null,
    sourceCategory: course?.category || null,
    gradingBasis,
    gradeValue: gradingBasis === "PASS_FAIL" ? "P" : "",
    ocrConfidence: course?.confidence ?? null,
  };
}

function normalizeCourseNameForMatch(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s/g, "")
    .toLocaleLowerCase("ko-KR");
}

async function enrichRecognizedCourseInitial(
  course,
  fallbackSemesterId,
  preferredAcademicUnitCode,
  userMajorName,
  sectionLookupCache,
) {
  const initial = mapRecognizedCourseToDraftInitial(
    course,
    fallbackSemesterId,
  );
  const normalizedCourseName = normalizeCourseNameForMatch(initial.name);
  if (!normalizedCourseName) return initial;

  const lookupSemesterIds = [fallbackSemesterId, course?.semester]
    .map((value) => String(value ?? "").trim())
    .filter((value, index, values) => value && values.indexOf(value) === index);

  for (const lookupSemesterId of lookupSemesterIds) {
    const cacheKey = `${lookupSemesterId}:${normalizedCourseName}`;
    if (!sectionLookupCache.has(cacheKey)) {
      sectionLookupCache.set(
        cacheKey,
        getAllSections({
          semesterId: lookupSemesterId,
          query: initial.name,
          preferredAcademicUnitCode,
        }).catch(() => []),
      );
    }

    const sections = await sectionLookupCache.get(cacheKey);
    const matchedSection = findPreferredSection(
      sections,
      (section) =>
        normalizeCourseNameForMatch(section.name) === normalizedCourseName,
      preferredAcademicUnitCode,
    );
    if (!matchedSection) continue;

    const matchedCredits = Number(matchedSection.credits);
    const matchedArea = resolveCourseAreaForUser(
      matchedSection,
      preferredAcademicUnitCode,
      userMajorName,
    );
    const hasSupportedInitialArea = [
      ...courseAreaOptions,
      ...courseLiberalAreaOptions,
    ].includes(initial.area);

    return {
      ...initial,
      area: hasSupportedInitialArea ? initial.area : matchedArea || initial.area,
      credits:
        initial.credits ||
        (initial.gradingBasis === "PASS_FAIL"
          ? "P/N"
          : formatCourseCredits(matchedSection.credits)),
      actualCredits:
        initial.actualCredits ||
        (Number.isFinite(matchedCredits) ? matchedCredits : 0),
      courseCode: matchedSection.courseCode || initial.courseCode,
      semesterId:
        course?.semester ||
        matchedSection.semesterId ||
        initial.semesterId,
      sourceCategory:
        initial.sourceCategory || matchedSection.category || null,
    };
  }

  return initial;
}

function completedCourseRequest(values, fallbackSemesterId) {
  const isLiberalArea = courseLiberalAreaOptions.includes(values.area);
  const isPassFail = values.credits === "P/N";
  const numericCredits = isPassFail
    ? Number(values.actualCredits)
    : Number.parseFloat(String(values.credits).replace("학점", ""));

  return {
    courseCode: values.courseCode || null,
    courseName: values.name,
    credits: Number.isFinite(numericCredits) ? numericCredits : 0,
    category: isLiberalArea
      ? "교양선택"
      : values.area || values.sourceCategory || "일반선택",
    area: isLiberalArea ? values.area : null,
    semester: values.semesterId || fallbackSemesterId || null,
    status: "COMPLETED",
    gradingBasis: isPassFail ? "PASS_FAIL" : "LETTER",
    gradeValue: isPassFail ? values.gradeValue || "P" : "",
  };
}

function MyCoursesPage({
  semesterId,
  preferredAcademicUnitCode,
  userMajorName,
  onTimetable,
  onMyPage,
}) {
  const [courses, setCourses] = useState([]);
  const [drafts, setDrafts] = useState([
    { key: "initial", editingId: null, initial: null },
  ]);
  const [showGraduation, setShowGraduation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [savingDraftKey, setSavingDraftKey] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrNotice, setOcrNotice] = useState("");
  const ocrInputRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setRequestError("");

    getCompletedCourses(controller.signal)
      .then((items) => {
        setCourses((items ?? []).map(mapCompletedCourse));
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setRequestError(
          error.status === 401
            ? "로그인 세션이 없어 저장된 강의를 불러오지 못했습니다."
            : error.message || "저장된 강의를 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const saveCourse = async (draft, values) => {
    setSavingDraftKey(draft.key);
    setRequestError("");

    try {
      const request = completedCourseRequest(values, semesterId);
      const updateRequest =
        draft.editingId &&
        !courseLiberalAreaOptions.includes(values.area)
          ? { ...request, area: "" }
          : request;
      const saved = draft.editingId
        ? await updateCompletedCourse(draft.editingId, updateRequest)
        : await createCompletedCourse(request);
      const nextCourse = mapCompletedCourse(saved);

      setCourses((current) =>
        draft.editingId
          ? current.map((course) =>
              course.id === draft.editingId ? nextCourse : course,
            )
          : [...current, nextCourse],
      );
      setDrafts((current) =>
        current.filter((item) => item.key !== draft.key),
      );
    } catch (error) {
      setRequestError(
        error.status === 401
          ? "로그인 세션이 없어 강의를 저장하지 못했습니다."
          : error.message || "강의를 저장하지 못했습니다.",
      );
    } finally {
      setSavingDraftKey(null);
    }
  };

  const removeCompletedCourse = async (course) => {
    setRequestError("");

    try {
      await deleteCompletedCourse(course.id);
      setCourses((current) =>
        current.filter((item) => item.id !== course.id),
      );
      setDrafts((current) =>
        current.filter((draft) => draft.editingId !== course.id),
      );
    } catch (error) {
      setRequestError(
        error.status === 401
          ? "로그인 세션이 없어 강의를 삭제하지 못했습니다."
          : error.message || "강의를 삭제하지 못했습니다.",
      );
    }
  };

  const editCourse = (course) => {
    setDrafts((current) => {
      if (current.some((draft) => draft.editingId === course.id)) {
        return current;
      }

      return [
        ...current,
        {
          key: `edit-${course.id}-${Date.now()}`,
          editingId: course.id,
          initial: course,
        },
      ];
    });
  };

  const importCourseImage = async (file) => {
    if (!file) return;

    if (file.size > 7 * 1024 * 1024) {
      setRequestError("이미지는 7MB 이하만 업로드할 수 있습니다.");
      return;
    }

    setOcrLoading(true);
    setRequestError("");
    setOcrNotice("");

    try {
      const result = await recognizeCompletedCourses(file);
      const recognizedCourses = (result?.recognizedCourses ?? []).filter(
        (course) => String(course?.courseName ?? "").trim(),
      );

      if (recognizedCourses.length === 0) {
        throw new Error(
          "이미지에서 과목 정보를 찾지 못했습니다. 글자가 선명한 성적표 이미지로 다시 시도해주세요.",
        );
      }

      const sectionLookupCache = new Map();
      const importedInitials = await Promise.all(
        recognizedCourses.map((course) =>
          enrichRecognizedCourseInitial(
            course,
            semesterId,
            preferredAcademicUnitCode,
            userMajorName,
            sectionLookupCache,
          ),
        ),
      );
      const importedAt = Date.now();
      const importedDrafts = importedInitials.map((initial, index) => ({
        key: `ocr-${importedAt}-${index}`,
        editingId: null,
        initial,
      }));
      const incompleteCourseCount = importedInitials.filter(
        (initial) => !initial.area || !initial.credits,
      ).length;

      setDrafts((current) => [...current, ...importedDrafts]);
      setOcrNotice(
        incompleteCourseCount > 0
          ? `${recognizedCourses.length}개 과목을 인식했습니다. 강의 정보가 없는 ${incompleteCourseCount}개 과목은 영역과 학점을 확인해주세요.`
          : `${recognizedCourses.length}개 과목을 인식하고 영역과 학점을 자동 입력했습니다. 내용을 확인한 뒤 각각 저장해주세요.`,
      );
    } catch (error) {
      setRequestError(
        error.status === 401
          ? "로그인 세션이 없어 이미지 OCR을 사용할 수 없습니다."
          : error.message || "이미지에서 강의 정보를 읽지 못했습니다.",
      );
      setOcrNotice("");
    } finally {
      setOcrLoading(false);
      if (ocrInputRef.current) ocrInputRef.current.value = "";
    }
  };

  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="my-courses-page relative h-full overflow-hidden">
        <div className="my-courses-content no-scrollbar h-full overflow-y-auto px-[14px] pb-[80px] pt-6">
        <header className="flex items-center justify-between">
          <h1 className="text-[18px] font-bold">내가 들은 강의 입력</h1>
          <button
            type="button"
            onClick={() => setShowGraduation(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-brand"
          >
            <GraduationCap size={15} /> 졸업요건 확인
          </button>
        </header>

        <button
          type="button"
          onClick={() => ocrInputRef.current?.click()}
          disabled={ocrLoading}
          className="mt-7 flex h-[53px] w-full flex-col items-center justify-center rounded-[14px] border border-brand text-brand disabled:cursor-wait disabled:opacity-70"
        >
          <span className="flex items-center gap-1 text-[15px] font-semibold">
            {ocrLoading ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <ImagePlus size={14} />
            )}
            {ocrLoading ? "이미지를 분석하고 있어요" : "이미지로 가져오기"}
          </span>
          <span className="mt-0.5 text-[10px] text-[#aaa]">
            {ocrLoading
              ? "과목 정보를 읽는 동안 잠시만 기다려주세요"
              : "에타 시간표로 편하게 입력하세요"}
          </span>
        </button>
        <input
          ref={ocrInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(event) => importCourseImage(event.target.files?.[0])}
        />

        <div className="my-8 flex items-center gap-6 text-[10px] text-[#aaa]">
          <span className="h-px flex-1 bg-[#ededed]" />
          또는 직접 입력
          <span className="h-px flex-1 bg-[#ededed]" />
        </div>

        <div className="course-form-list grid gap-2">
          {drafts.map((draft) => (
            <CourseInputForm
              key={draft.key}
              initial={draft.initial}
              semesterId={semesterId}
              preferredAcademicUnitCode={preferredAcademicUnitCode}
              userMajorName={userMajorName}
              onSave={(values) => saveCourse(draft, values)}
              onCancel={() =>
                setDrafts((current) =>
                  current.filter((item) => item.key !== draft.key),
                )
              }
            />
          ))}
        </div>

        {savingDraftKey && (
          <p className="mt-2 text-center text-[10px] text-brand">
            강의를 저장하고 있습니다.
          </p>
        )}
        {requestError && (
          <p className="mt-2 rounded-[10px] bg-red-50 px-3 py-2 text-[10px] leading-4 text-red-600">
            {requestError}
          </p>
        )}
        {ocrNotice && (
          <p
            aria-live="polite"
            className="mt-2 rounded-[10px] bg-[#f5f1ff] px-3 py-2 text-[10px] leading-4 text-brand"
          >
            {ocrNotice}
          </p>
        )}
        {loading && (
          <p className="mt-4 text-center text-[11px] text-[#999]">
            저장된 강의를 불러오는 중입니다.
          </p>
        )}

        <div className="saved-course-list no-scrollbar mt-2 max-h-[335px] space-y-2 overflow-y-auto">
          {courses.map((course) => (
            <article
              key={course.id}
              className="flex h-[56px] items-center rounded-[13px] border border-[#e2e2e2] px-2"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13px] font-medium">{course.name}</h3>
                <p className="mt-1 text-[10px] text-[#aaa]">
                  {course.area}　　{course.credits}
                </p>
              </div>
              <button className="p-2 text-[#999]" onClick={() => editCourse(course)} aria-label={`${course.name} 수정`}>
                <Pencil size={13} />
              </button>
              <button
                className="p-2 text-[#999]"
                onClick={() => removeCompletedCourse(course)}
                aria-label={`${course.name} 삭제`}
              >
                <Trash2 size={13} />
              </button>
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setDrafts((current) => [
              ...current,
              {
                key: `new-${Date.now()}`,
                editingId: null,
                initial: null,
              },
            ])
          }
          className="add-course-button mt-4 h-[46px] w-full rounded-[11px] border border-dashed border-brand text-[12px] font-semibold text-brand"
        >
          + 과목 추가
        </button>
        </div>

        <BottomNavigation
          active="courses"
          onCourses={() => {}}
          onTimetable={onTimetable}
          onMyPage={onMyPage}
        />
        {showGraduation && (
          <GraduationModal
            semesterId={semesterId}
            onClose={() => setShowGraduation(false)}
          />
        )}
      </div>
    </main>
  );
}

export default function App() {
  const [authStep, setAuthStep] = useState("checking");
  const [loginError, setLoginError] = useState("");
  const [googleAuthResult] = useState(() => {
    const currentUrl = new URL(window.location.href);
    return currentUrl.searchParams.get("auth");
  });
  const [currentTab, setCurrentTab] = useState("timetable");
  const [selectedTimetableId, setSelectedTimetableId] = useState(null);
  const [timetableReturnTab, setTimetableReturnTab] = useState("mytimetablelist");
  const [user, setUser] = useState(null);
  const [currentSemesterId, setCurrentSemesterId] = useState(
    FALLBACK_SEMESTER_ID,
  );
  const [timetables, setTimetables] = useState(() =>
    createInitialTimetables(FALLBACK_SEMESTER_ID),
  );
  const [activeTimetableId, setActiveTimetableId] = useState(1);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [focusedCourseId, setFocusedCourseId] = useState(null);
  const [timeSelections, setTimeSelections] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [majors, setMajors] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedCollegeCode, setSelectedCollegeCode] = useState(null);
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState("");
  const [grades, setGrades] = useState([]);
  const [otherGrade, setOtherGrade] = useState(false);
  const [sort, setSort] = useState("");
  const [overlay, setOverlay] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [courseConflict, setCourseConflict] = useState(null);
  const [showComplete, setShowComplete] = useState(false);
  const [generatedScheduleCount, setGeneratedScheduleCount] = useState(0);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationError, setOptimizationError] = useState(null);
  const [timetableSyncError, setTimetableSyncError] = useState("");
  const [showFirstLoginTutorial, setShowFirstLoginTutorial] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const dragStartY = useRef(null);
  const dragStartX = useRef(null);
  const dragPointerId = useRef(null);
  const nextTimetableId = useRef(2);
  const nextTimeSelectionId = useRef(1);
  const optimizationAbortRef = useRef(null);

  const activeTimetable =
    timetables.find((item) => item.id === activeTimetableId) ?? null;
  const selectedCourses = activeTimetable?.courses ?? [];
  const focusedCourse =
    selectedCourses.find((course) => course.id === focusedCourseId) ?? null;

  const setSelectedCourses = (nextCourses) => {
    setTimetables((current) =>
      current.map((item) => {
        if (item.id !== activeTimetableId) return item;
        return {
          ...item,
          courses:
            typeof nextCourses === "function"
              ? nextCourses(item.courses)
              : nextCourses,
        };
      }),
    );
  };

  const persistTimetableCourses = async (timetable, nextCourses) => {
    if (!timetable) return null;

    const sections = toTimetableSectionRequests(nextCourses);
    const saved = timetable.serverId
      ? await replaceTimetableSections(timetable.serverId, sections)
      : await createTimetable({
          name: timetable.name,
          semesterId: timetable.semesterId ?? currentSemesterId,
          sections,
        });

    setTimetables((current) =>
      current.map((item) =>
        item.id === timetable.id
          ? {
              ...item,
              serverId: saved?.id ?? timetable.serverId,
              semesterId: saved?.semesterId ?? item.semesterId,
              totalCredits: saved?.totalCredits,
              courses: nextCourses,
            }
          : item,
      ),
    );
    setTimetableSyncError("");
    return saved;
  };

  useEffect(
    () => () => {
      optimizationAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    const currentUrl = new URL(window.location.href);

    if (googleAuthResult) {
      currentUrl.searchParams.delete("auth");
      window.history.replaceState(
        {},
        "",
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
      );
    }

    if (googleAuthResult === "google-failure") {
      setLoginError(
        "Google 로그인에 실패했습니다. 계정을 확인한 뒤 다시 시도해 주세요.",
      );
      setAuthStep("login");
      return () => controller.abort();
    }

    setLoginError("");

    getAuthSession(controller.signal)
      .then((session) => {
        if (!session?.authenticated) {
          throw new ApiError(
            401,
            "AUTH_SESSION_EXPIRED",
            "로그인이 필요합니다.",
          );
        }

        return getCurrentUser(controller.signal).then((profile) => ({
          profile,
          sessionUser: session.user,
        }));
      })
      .then(({ profile, sessionUser }) => {
        const mappedProfile = mapUserProfile(profile, {
          id: sessionUser?.id,
          name: sessionUser?.name,
          studentId: sessionUser?.studentNumber,
        });

        setUser(mappedProfile);
        setCurrentTab("timetable");
        setAuthStep(
          mappedProfile.profileCompleted ? "app" : "signup",
        );
      })
      .catch((error) => {
        if (error.name === "AbortError") return;

        setUser(null);
        setAuthStep("login");

        if (
          googleAuthResult === "google-success" ||
          (error.status !== 401 && error.code !== "AUTH_SESSION_EXPIRED")
        ) {
          setLoginError(
            error.message ||
              "로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.",
          );
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    getSemesters(controller.signal)
      .then((semesters) => {
        const latestSemester = findLatestSemester(semesters);
        if (!latestSemester?.id) return;

        setCurrentSemesterId(latestSemester.id);
        setTimetables((current) =>
          current.map((item) => {
            if (item.serverId || item.semesterId === latestSemester.id) {
              return item;
            }

            return {
              ...item,
              semesterId: latestSemester.id,
              courses: [],
            };
          }),
        );
        setActiveCourseId(null);
        setFocusedCourseId(null);
        setTimeSelections([]);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        // 학기 조회에 실패하면 화면은 fallback 학기로 계속 동작합니다.
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (authStep !== "app") return undefined;

    const controller = new AbortController();

    getCurrentUser(controller.signal)
      .then((profile) => {
        const mappedProfile = mapUserProfile(profile, user ?? {});
        setUser(mappedProfile);
        if (!hasCompletedTutorial(mappedProfile)) {
          setShowFirstLoginTutorial(true);
        }
      })
      .catch((error) => {
        if (error.name === "AbortError" || error.status === 401) return;
        setTimetableSyncError(
          error.message || "사용자 정보를 불러오지 못했습니다.",
        );
      });

    return () => controller.abort();
  }, [authStep]);

  useEffect(() => {
    if (authStep !== "app") return undefined;

    const controller = new AbortController();
    setDepartmentsLoading(true);
    setDepartmentsError("");

    Promise.all([
      getAllDepartments({ currentOnly: true }, controller.signal),
      getColleges({ currentOnly: true }, controller.signal),
    ])
      .then(([departments, colleges]) => {
        setDepartmentOptions(departments);
        setCollegeOptions(colleges ?? []);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setDepartmentOptions([]);
        setCollegeOptions([]);
        setDepartmentsError(
          error.message || "학과 필터를 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setDepartmentsLoading(false);
      });

    return () => controller.abort();
  }, [authStep]);

  useEffect(() => {
    if (authStep !== "app") return undefined;

    const controller = new AbortController();

    getTimetables(controller.signal)
      .then(async (summaries) => {
        const details = await Promise.all(
          (summaries ?? []).map((summary) =>
            getTimetable(summary.id, controller.signal),
          ),
        );

        if (controller.signal.aborted) return;

        if (details.length === 0) {
          const fallback = createInitialTimetables(currentSemesterId);
          setTimetables(fallback);
          setActiveTimetableId(fallback[0].id);
          return;
        }

        setTimetables((current) =>
          details.map((detail) => {
            const timetable = mapTimetableResponse(detail);
            return {
              ...timetable,
              favorite: Boolean(timetable.favorite),
            };
          }),
        );
        setActiveTimetableId(`server-${details[0].id}`);
        setTimetableSyncError("");
      })
      .catch((error) => {
        if (error.name === "AbortError" || error.status === 401) return;
        setTimetableSyncError(
          error.message || "저장된 시간표를 불러오지 못했습니다.",
        );
      });

    return () => controller.abort();
  }, [authStep, currentSemesterId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  const selectedCollegeDepartments = useMemo(
    () =>
      departmentOptions
        .filter(
          (department) => department.collegeCode === selectedCollegeCode,
        )
        .sort((first, second) =>
          first.name.localeCompare(second.name, "ko"),
        ),
    [departmentOptions, selectedCollegeCode],
  );

  const filterResolution = useMemo(() => {
    if (otherGrade) {
      return {
        issue: "현재 API에는 ‘기타 학년’에 대응하는 요청값이 없습니다.",
        params: {},
      };
    }

    const params = {};
    const selectedGrades = grades.map(String);
    const categories = [];
    const completionCategories = [];

    if (selectedGrades.length > 0) {
      params.targetGrade = selectedGrades;
    }

    majors.forEach((major) => {
      const mappedFilter = MAJOR_API_FILTERS[major];
      if (mappedFilter?.category) categories.push(mappedFilter.category);
      if (mappedFilter?.completionCategory) {
        completionCategories.push(mappedFilter.completionCategory);
      }
    });

    if (categories.length > 0) params.category = categories;
    if (completionCategories.length > 0) {
      params.completionCategory = completionCategories;
    }
    if (selectedDepartments.length > 0) {
      params.academicUnitCode = selectedDepartments.map(
        (department) => department.code,
      );
    }
    return { issue: null, params };
  }, [
    grades,
    majors,
    otherGrade,
    selectedDepartments,
  ]);

  const sectionParams = useMemo(
    () => ({
      semesterId: activeTimetable?.semesterId ?? currentSemesterId,
      query: debouncedQuery,
      preferredAcademicUnitCode: user?.departmentCode || undefined,
      sort: SORT_API_VALUES[sort] ?? "DEFAULT",
      size: COURSE_PAGE_SIZE,
      ...filterResolution.params,
    }),
    [
      activeTimetable?.semesterId,
      currentSemesterId,
      debouncedQuery,
      filterResolution.params,
      sort,
      user?.departmentCode,
    ],
  );

  const {
    courses,
    error: courseError,
    hasMore: hasMoreCourses,
    loadMore: loadMoreCourses,
    loading: coursesLoading,
    loadingMore: coursesLoadingMore,
    retry: retryCourses,
  } = useSectionCourses(sectionParams, {
    enabled:
      authStep === "app" &&
      currentTab === "timetable" &&
      filterResolution.issue === null,
  });

  const activeCourse =
    courses.find((course) => course.id === activeCourseId) ?? null;
  const timeFilteredCourses = useMemo(
    () =>
      courses.filter((course) =>
        courseMatchesTimeSelections(course, timeSelections),
      ),
    [courses, timeSelections],
  );

  useEffect(() => {
    if (
      timeSelections.length === 0 ||
      coursesLoading ||
      coursesLoadingMore ||
      !hasMoreCourses ||
      timeFilteredCourses.length >= 12
    ) {
      return;
    }

    loadMoreCourses();
  }, [
    courses.length,
    coursesLoading,
    coursesLoadingMore,
    hasMoreCourses,
    loadMoreCourses,
    timeFilteredCourses.length,
    timeSelections.length,
  ]);

  const addTimeSelection = (selection) => {
    setTimeSelections((current) => {
      const incomingCells = getTimeSelectionCells(selection);
      const incomingKeys = new Set(
        incomingCells.map((cell) => timeCellKey(cell.day, cell.slot)),
      );
      const overlappingSelections = current.filter((item) =>
        item.cells.some((cell) =>
          incomingKeys.has(timeCellKey(cell.day, cell.slot)),
        ),
      );

      if (overlappingSelections.some((item) => item.locked)) {
        return current;
      }

      if (overlappingSelections.length === 0) {
        const id = nextTimeSelectionId.current;
        nextTimeSelectionId.current += 1;
        return [...current, { id, cells: incomingCells, locked: false }];
      }

      const mergedKeys = new Set(incomingKeys);
      overlappingSelections.forEach((item) => {
        item.cells.forEach((cell) => {
          mergedKeys.add(timeCellKey(cell.day, cell.slot));
        });
      });

      const overlappingIds = new Set(
        overlappingSelections.map((item) => item.id),
      );
      const mergedCells = [...mergedKeys]
        .map((key) => {
          const [day, slot] = key.split(":").map(Number);
          return { day, slot };
        })
        .sort((first, second) => first.day - second.day || first.slot - second.slot);
      const retainedSelections = current.filter(
        (item) => !overlappingIds.has(item.id),
      );

      return [
        ...retainedSelections,
        {
          id: overlappingSelections[0].id,
          cells: mergedCells,
          locked: false,
        },
      ];
    });
  };

  const removeTimeSelection = (selectionId) => {
    setTimeSelections((current) =>
      current.filter((selection) => selection.id !== selectionId),
    );
  };

  const toggleTimeSelectionLock = (selectionId) => {
    const targetSelection = timeSelections.find(
      (selection) => selection.id === selectionId,
    );

    if (
      targetSelection &&
      !targetSelection.locked &&
      selectedCourses
        .filter((course) => course.locked)
        .some((course) =>
          courseOverlapsTimeSelections(course, [targetSelection]),
        )
    ) {
      window.alert(
        "고정된 강의와 겹치는 시간대는 비우는 시간으로 고정할 수 없습니다.",
      );
      return;
    }

    setTimeSelections((current) =>
      current.map((selection) =>
        selection.id === selectionId
          ? { ...selection, locked: !selection.locked }
          : selection,
      ),
    );
  };

  const addTimetable = async () => {
    const timetableId = nextTimetableId.current;
    nextTimetableId.current += 1;
    const nextTimetable = {
      id: timetableId,
      name: `시간표 ${timetableId}`,
      semesterId: currentSemesterId,
      favorite: false,
      courses: [],
    };

    setTimetables((current) => [
      ...current,
      nextTimetable,
    ]);
    setActiveTimetableId(timetableId);
    setActiveCourseId(null);
    setFocusedCourseId(null);
    setTimeSelections([]);

    try {
      const saved = await createTimetable({
        name: nextTimetable.name,
        semesterId: nextTimetable.semesterId,
        sections: [],
      });
      setTimetables((current) =>
        current.map((item) =>
          item.id === timetableId
            ? {
                ...item,
                serverId: saved.id,
                totalCredits: saved.totalCredits,
              }
            : item,
        ),
      );
      setTimetableSyncError("");
    } catch (error) {
      setTimetableSyncError(
        error.status === 401
          ? "로그인 세션이 없어 새 시간표를 서버에 저장하지 못했습니다."
          : error.message || "새 시간표를 서버에 저장하지 못했습니다.",
      );
    }
  };

  const selectTimetable = (timetableId) => {
    setActiveTimetableId(timetableId);
    setActiveCourseId(null);
    setFocusedCourseId(null);
    setTimeSelections([]);
  };

  const renameTimetable = async (timetableId, name) => {
    const target = timetables.find((item) => item.id === timetableId);
    setTimetables((current) =>
      current.map((item) =>
        item.id === timetableId ? { ...item, name } : item,
      ),
    );

    try {
      if (target?.serverId) {
        await updateServerTimetable(target.serverId, name);
      } else if (target) {
        const saved = await createTimetable({
          name,
          semesterId: target.semesterId ?? currentSemesterId,
          sections: toTimetableSectionRequests(target.courses),
        });
        setTimetables((current) =>
          current.map((item) =>
            item.id === timetableId
              ? { ...item, serverId: saved.id }
              : item,
          ),
        );
      }
      setTimetableSyncError("");
    } catch (error) {
      setTimetableSyncError(
        error.status === 401
          ? "로그인 세션이 없어 시간표 이름을 서버에 저장하지 못했습니다."
          : error.message || "시간표 이름을 서버에 저장하지 못했습니다.",
      );
    }
  };

  const deleteTimetable = async (timetableId) => {
    const target = timetables.find((item) => item.id === timetableId);
    const filtered = timetables.filter((item) => item.id !== timetableId);
    const remaining =
      filtered.length > 0
        ? filtered
        : createInitialTimetables(currentSemesterId);
    setTimetables(remaining);

    if (activeTimetableId === timetableId) {
      setActiveTimetableId(remaining[0]?.id ?? null);
      setActiveCourseId(null);
      setFocusedCourseId(null);
    }

    try {
      if (target?.serverId) {
        await deleteServerTimetable(target.serverId);
      }
      setTimetableSyncError("");
    } catch (error) {
      setTimetableSyncError(
        error.status === 401
          ? "로그인 세션이 없어 시간표를 서버에서 삭제하지 못했습니다."
          : error.message || "시간표를 서버에서 삭제하지 못했습니다.",
      );
    }
  };

  const toggleTimetableFavorite = async (timetableId) => {
    const target = timetables.find((item) => item.id === timetableId);
    if (!target) return;

    const nextFavorite = !target.favorite;
    setTimetables((current) =>
      current.map((item) =>
        item.id === timetableId
          ? { ...item, favorite: nextFavorite }
          : item,
      ),
    );

    try {
      let serverTimetableId = target.serverId;

      if (!serverTimetableId) {
        const saved = await createTimetable({
          name: target.name,
          semesterId: target.semesterId ?? currentSemesterId,
          sections: toTimetableSectionRequests(target.courses),
        });
        serverTimetableId = saved.id;
      }

      const saved = await updateTimetableFavorite(
        serverTimetableId,
        nextFavorite,
      );
      setTimetables((current) =>
        current.map((item) =>
          item.id === timetableId
            ? {
                ...item,
                serverId: serverTimetableId,
                favorite: Boolean(saved?.favorite ?? nextFavorite),
              }
            : item,
        ),
      );
      setTimetableSyncError("");
    } catch (error) {
      setTimetables((current) =>
        current.map((item) =>
          item.id === timetableId
            ? { ...item, favorite: target.favorite }
            : item,
        ),
      );
      setTimetableSyncError(
        error.status === 401
          ? "로그인 세션이 없어 즐겨찾기를 서버에 저장하지 못했습니다."
          : error.message || "즐겨찾기를 서버에 저장하지 못했습니다.",
      );
    }
  };

  const commitCourse = async (course) => {
    if (!activeTimetable) return;
    const nextCourses = selectedCourses.some((item) => item.id === course.id)
      ? selectedCourses
      : [...selectedCourses, course];

    setSelectedCourses(nextCourses);
    setActiveCourseId(null);
    setFocusedCourseId(null);

    try {
      await persistTimetableCourses(activeTimetable, nextCourses);
    } catch (error) {
      setTimetableSyncError(
        error.status === 401
          ? "로그인 세션이 없어 강의 추가 내용을 서버에 저장하지 못했습니다."
          : error.message || "강의 추가 내용을 서버에 저장하지 못했습니다.",
      );
    }
  };

  const removeCourse = async (courseId) => {
    if (!activeTimetable) return;
    const nextCourses = selectedCourses.filter(
      (course) => course.id !== courseId,
    );

    setSelectedCourses(nextCourses);
    setActiveCourseId((current) => (current === courseId ? null : current));
    setFocusedCourseId((current) => (current === courseId ? null : current));

    try {
      await persistTimetableCourses(activeTimetable, nextCourses);
    } catch (error) {
      setTimetableSyncError(
        error.status === 401
          ? "로그인 세션이 없어 강의 삭제 내용을 서버에 저장하지 못했습니다."
          : error.message || "강의 삭제 내용을 서버에 저장하지 못했습니다.",
      );
    }
  };

  const toggleCourseLock = (courseId) => {
    const targetCourse = selectedCourses.find(
      (course) => String(course.id) === String(courseId),
    );
    const lockedTimeSelections = timeSelections.filter(
      (selection) => selection.locked,
    );

    if (
      targetCourse &&
      !targetCourse.locked &&
      courseOverlapsTimeSelections(targetCourse, lockedTimeSelections)
    ) {
      window.alert(
        "비우기로 고정한 시간대와 겹치는 강의는 고정할 수 없습니다.",
      );
      return;
    }

    setSelectedCourses((current) =>
      current.map((course) =>
        String(course.id) === String(courseId)
          ? { ...course, locked: !course.locked }
          : course,
      ),
    );
  };

  const addCourse = (course) => {
    if (selectedCourses.some((item) => item.id === course.id)) return;

    const conflicts = getConflictingCourses(course, selectedCourses);

    if (conflicts.length > 0) {
      setCourseConflict({ course, conflicts });
      return;
    }

    commitCourse(course);
  };

  const autoGenerate = async ({
    days = [],
    times = [],
    liberals = [],
    grades: preferredGrades = [],
    minCredits = 12,
    maxCredits = 22,
  } = {}) => {
    if (!activeTimetable || optimizationLoading) return;

    optimizationAbortRef.current?.abort();
    const controller = new AbortController();
    optimizationAbortRef.current = controller;
    const targetTimetableId = activeTimetable.id;
    const lockedCourses = selectedCourses.filter((course) => course.locked);
    const lockedTimeSelections = timeSelections.filter(
      (selection) => selection.locked,
    );
    const invalidLockedCourse = lockedCourses.find(
      (course) => !getSectionKey(course),
    );
    const unscheduledLockedCourse = lockedCourses.find(
      (course) => !canUseAsOptimizationCandidate(course),
    );

    setOptimizationError(null);
    setOptimizationLoading(true);

    try {
      if (invalidLockedCourse) {
        throw new Error(
          `‘${invalidLockedCourse.name}’ 강의에는 서버 과목·분반 코드가 없어 고정 강의로 전송할 수 없습니다. API 검색 결과에서 해당 강의를 다시 추가해주세요.`,
        );
      }

      if (unscheduledLockedCourse) {
        throw new Error(
          `‘${unscheduledLockedCourse.name}’ 강의는 수업시간이 미정이라 고정 강의로 자동편성에 사용할 수 없습니다.`,
        );
      }

      const lockedCourseKeys = new Set(
        lockedCourses.map(getSectionKey).filter(Boolean),
      );
      const categoryFilters = liberals
        .map((liberal) => MAJOR_API_FILTERS[liberal]?.category)
        .filter(Boolean);
      const hasCandidateFilters =
        categoryFilters.length > 0 || preferredGrades.length > 0;
      const candidatePool = hasCandidateFilters
        ? await getAllSections(
            {
              semesterId:
                activeTimetable.semesterId ?? currentSemesterId,
              category: categoryFilters,
              targetGrade: preferredGrades.map(String),
              sort: "DEFAULT",
            },
            controller.signal,
          )
        : [];
      const filteredCandidates = candidatePool.filter(
        canUseAsOptimizationCandidate,
      );

      if (hasCandidateFilters && candidatePool.length === 0) {
        throw new Error(
          "선택한 학년·교양 조건에 맞는 후보 강의가 없습니다. 조건을 줄여서 다시 시도해주세요.",
        );
      }

      if (hasCandidateFilters && filteredCandidates.length === 0) {
        throw new Error(
          "선택한 조건에 수업시간이 확정된 후보 강의가 없습니다. 조건을 바꿔서 다시 시도해주세요.",
        );
      }

      const sourceCourses = mergeCoursesBySection(
        lockedCourses,
        selectedCourses,
        filteredCandidates,
        courses,
      );

      let serverTimetableId = activeTimetable.serverId;

      if (!serverTimetableId) {
        const serverTimetable = await createTimetable(
          {
            name: activeTimetable.name,
            semesterId:
              activeTimetable.semesterId ?? currentSemesterId,
            sections: [],
          },
          controller.signal,
        );
        serverTimetableId = serverTimetable?.id;

        if (!serverTimetableId) {
          throw new Error("자동편성에 사용할 서버 시간표를 만들지 못했습니다.");
        }

        setTimetables((current) =>
          current.map((item) =>
            item.id === targetTimetableId
              ? { ...item, serverId: serverTimetableId }
              : item,
          ),
        );
      }

      const optimizationJob = await createOptimizationJob(
        {
          timetableId: serverTimetableId,
          minCredits,
          maxCredits,
          targetCredits: Math.round((minCredits + maxCredits) / 2),
          excludedDays: days.map((day) => DAY_API_VALUES[day]).filter(Boolean),
          availableTimes: getAvailableTimes(times),
          blockedTimes: getBlockedTimes(lockedTimeSelections),
          lunchTime: {
            startTime: "12:00:00",
            endTime: "13:00:00",
          },
          maxDailyClassMinutes: 600,
          candidateCourses: filteredCandidates.map((course) => ({
            courseCode: course.courseCode,
            sectionCode: course.sectionCode,
            required: false,
          })),
          requiredCourses: lockedCourses.map((course) => ({
            courseCode: course.courseCode,
            sectionCode: course.sectionCode,
            required: true,
          })),
        },
        controller.signal,
      );

      if (!optimizationJob?.id) {
        throw new Error("자동편성 작업 ID를 받지 못했습니다.");
      }

      const completedJob =
        optimizationJob.status === "SUCCESS"
          ? optimizationJob
          : await waitForOptimizationJob(optimizationJob.id, {
              signal: controller.signal,
            });

      if (completedJob.status !== "SUCCESS") {
        throw new Error(
          completedJob.failureReason ||
            "서버에서 자동편성 작업을 완료하지 못했습니다.",
        );
      }

      const results = [...(completedJob.results ?? [])].sort(
        (first, second) => (first.rank ?? 0) - (second.rank ?? 0),
      );

      if (results.length === 0 || !results[0]?.sections?.length) {
        throw new Error("조건에 맞는 자동편성 결과가 없습니다.");
      }

      const appliedRank = results[0].rank ?? 1;
      const savedTimetable = await applyOptimizationResult(
        optimizationJob.id,
        appliedRank,
        controller.signal,
      );
      const mappedTimetable = mapTimetableResponse(
        savedTimetable,
        sourceCourses,
      );
      const generatedCourses = mappedTimetable.courses.map((course) => ({
        ...course,
        locked: lockedCourseKeys.has(getSectionKey(course)),
      }));

      setTimetables((current) =>
        current.map((item) =>
          item.id === targetTimetableId
            ? {
                ...item,
                serverId: serverTimetableId,
                semesterId:
                  savedTimetable?.semesterId ?? item.semesterId,
                totalCredits:
                  savedTimetable?.totalCredits ?? item.totalCredits,
                favorite:
                  savedTimetable?.favorite ?? item.favorite,
                courses: generatedCourses,
              }
            : item,
        ),
      );
      setGeneratedScheduleCount(results.length);
      setActiveCourseId(null);
      setFocusedCourseId(null);
      setShowComplete(true);
    } catch (error) {
      const message = getOptimizationErrorMessage(error);
      if (message) setOptimizationError(message);
    } finally {
      if (optimizationAbortRef.current === controller) {
        optimizationAbortRef.current = null;
        setOptimizationLoading(false);
      }
    }
  };

  const handleCourseListScroll = (event) => {
    if (focusedCourse) return;

    const element = event.currentTarget;
    const remaining =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (remaining < 160 && hasMoreCourses) {
      loadMoreCourses();
    }
  };

  const toggleFilterGrade = (value) => {
    setGrades((current) =>
      current.includes(value)
        ? current.filter((gradeValue) => gradeValue !== value)
        : [...current, value].sort((a, b) => a - b),
    );
  };

  const addMajorFilter = (value) => {
    setMajors((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const openFilter = (name, event) => {
    setFocusedCourseId(null);

    if (window.innerWidth >= 1024) {
      const layout = event.currentTarget.closest(".timetable-layout");
      const layoutRect = layout?.getBoundingClientRect();
      const buttonRect = event.currentTarget.getBoundingClientRect();
      const relativeLeft = buttonRect.left - (layoutRect?.left || 0);
      setFilterAnchor({
        left: Math.max(
          12,
          Math.min(relativeLeft, (layoutRect?.width || window.innerWidth) - 226),
        ),
        top: buttonRect.bottom - (layoutRect?.top || 0) + 8,
      });
    } else {
      setFilterAnchor(null);
    }
    setOverlay(name);
  };

  const gradeLabel = (() => {
    if (grades.length && otherGrade) return `${grades.join("·")} 학년·기타`;
    if (grades.length) return `${grades.join("·")} 학년`;
    if (otherGrade) return "기타";
    return "학년";
  })();

  const startSheetDrag = (event) => {
    if (event.pointerType === "touch") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    dragStartY.current = event.clientY;
    dragStartX.current = event.clientX;
    dragPointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const endSheetDrag = (event) => {
    if (dragStartY.current !== null && dragStartX.current !== null) {
      const distanceY = event.clientY - dragStartY.current;
      const distanceX = event.clientX - dragStartX.current;

      if (Math.abs(distanceY) > Math.abs(distanceX)) {
        if (distanceY < -36) setSheetExpanded(true);
        if (distanceY > 36) setSheetExpanded(false);
      }
    }

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStartY.current = null;
    dragStartX.current = null;
    dragPointerId.current = null;
  };

  const moveSheetDrag = (event) => {
    if (
      dragStartY.current === null ||
      dragStartX.current === null ||
      dragPointerId.current !== event.pointerId
    ) {
      return;
    }
    const distanceY = event.clientY - dragStartY.current;
    const distanceX = event.clientX - dragStartX.current;

    if (Math.abs(distanceX) >= Math.abs(distanceY)) return;

    if (Math.abs(distanceY) > 8) event.preventDefault();
    if (distanceY < -36) setSheetExpanded(true);
    if (distanceY > 36) setSheetExpanded(false);
  };

  const cancelSheetDrag = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStartY.current = null;
    dragStartX.current = null;
    dragPointerId.current = null;
  };

  const startSheetTouch = (event) => {
    const touch = event.touches[0];
    if (!touch) return;

    dragStartY.current = touch.clientY;
    dragStartX.current = touch.clientX;
  };

  const moveSheetTouch = (event) => {
    const touch = event.touches[0];
    if (
      !touch ||
      dragStartY.current === null ||
      dragStartX.current === null
    ) {
      return;
    }

    const distanceY = touch.clientY - dragStartY.current;
    const distanceX = touch.clientX - dragStartX.current;
    if (Math.abs(distanceX) >= Math.abs(distanceY)) return;

    if (Math.abs(distanceY) > 8) event.preventDefault();
    if (distanceY < -36) setSheetExpanded(true);
    if (distanceY > 36) setSheetExpanded(false);
  };

  const endSheetTouch = (event) => {
    const touch = event.changedTouches[0];
    if (
      touch &&
      dragStartY.current !== null &&
      dragStartX.current !== null
    ) {
      const distanceY = touch.clientY - dragStartY.current;
      const distanceX = touch.clientX - dragStartX.current;

      if (Math.abs(distanceY) > Math.abs(distanceX)) {
        if (distanceY < -36) setSheetExpanded(true);
        if (distanceY > 36) setSheetExpanded(false);
      }
    }

    dragStartY.current = null;
    dragStartX.current = null;
  };

  if (authStep === "checking") {
    return <LoginPage checking onGoogleLogin={() => {}} />;
  }

  if (authStep === "login") {
    return (
      <LoginPage
        error={loginError}
        onGoogleLogin={() => {
          setLoginError("");

          try {
            window.location.assign(getGoogleLoginUrl());
          } catch (error) {
            setLoginError(
              error.message ||
                "Google 로그인을 시작하지 못했습니다.",
            );
          }
        }}
      />
    );
  }
  
  if (authStep === "signup") {
    return (
      <SignupInfoPage
        googleProfile={user}
        onBack={() => setAuthStep("login")}
        onComplete={async (info) => {
          const saved = await updateCurrentUser({
            studentNumber: info.studentId,
            name: info.name,
            grade: info.grade,
            departmentId: info.departmentCode,
            programPath: info.programPath,
            admissionYear:
              Number(String(info.studentId ?? "").slice(0, 4)) || undefined,
          });
          const mappedProfile = mapUserProfile(saved, info);

          setUser(mappedProfile);
          setAuthStep("app");
          setCurrentTab("timetable");
          if (!hasCompletedTutorial(mappedProfile)) {
            setShowFirstLoginTutorial(true);
          }
        }}
      />
    );
  }

  if (currentTab === "courses") {
    return (
      <MyCoursesPage
        semesterId={currentSemesterId}
        preferredAcademicUnitCode={user?.departmentCode}
        userMajorName={user?.major}
        onTimetable={() => setCurrentTab("timetable")}
        onMyPage={() => setCurrentTab("mypage")}
      />
    );
  }

  if (currentTab === "mypage") {
    return (
      <MyPage
        user={user}
        onCourses={() => setCurrentTab("courses")}
        onTimetable={() => setCurrentTab("timetable")}
        onMyTimetableList={() => setCurrentTab("mytimetablelist")}
        onFavoriteTimetableList={() => setCurrentTab("myfavoritetimetablelist")}
        onAccountInfo={() => setCurrentTab("myaccountinfo")}
        onWithdraw={async () => {
          try {
            await withdrawCurrentUser();
            alert("회원탈퇴가 완료되었습니다.");
            setUser(null);
            setShowFirstLoginTutorial(false);
            setAuthStep("login");
            setCurrentTab("timetable");
          } catch (error) {
            alert(
              error.status === 401
                ? "로그인 세션이 없어 회원탈퇴를 처리하지 못했습니다."
                : error.message || "회원탈퇴를 처리하지 못했습니다.",
            );
          }
        }}
      />
    );
  }
  
  if (currentTab === "mytimetablelist") {
    return (
      <MyTimetableList
        timetables={timetables}
        currentSemesterId={currentSemesterId}
        onBack={() => setCurrentTab("mypage")}
        onCourses={() => setCurrentTab("courses")}
        onTimetable={() => setCurrentTab("timetable")}
        onMyPage={() => setCurrentTab("mypage")}
        onSelectTimetable={(id) => {
          setSelectedTimetableId(id);
          setTimetableReturnTab("mytimetablelist");
          setCurrentTab("mytimetabledetail");
        }}
      />
    );
  }
  
  if (currentTab === "mytimetabledetail") {
    return (
      <MyTimetableDetail
        timetables={timetables}
        timetableId={selectedTimetableId}
        onBack={() => setCurrentTab(timetableReturnTab)}
        onCourses={() => setCurrentTab("courses")}
        onTimetable={() => setCurrentTab("timetable")}
        onMyPage={() => setCurrentTab("mypage")}
      />
    );
  }

  if (currentTab === "myfavoritetimetablelist") {
    return (
      <MyFavoriteTimetableList
        timetables={timetables}
        onBack={() => setCurrentTab("mypage")}
        onCourses={() => setCurrentTab("courses")}
        onTimetable={() => setCurrentTab("timetable")}
        onMyPage={() => setCurrentTab("mypage")}
        onSelectTimetable={(id) => {
          setSelectedTimetableId(id);
          setTimetableReturnTab("myfavoritetimetablelist");
          setCurrentTab("mytimetabledetail");
        }}
      />
    );
  }

  if (currentTab === "myaccountinfo") {
    return (
      <MyAccountInfo
        user={user}
        onSave={async (updatedUser) => {
          const saved = await updateCurrentUser({
            studentNumber: updatedUser.studentId,
            name: updatedUser.name,
            grade: updatedUser.grade,
            departmentId: updatedUser.departmentCode,
            programPath: updatedUser.programPath,
            admissionYear:
              Number(String(updatedUser.studentId ?? "").slice(0, 4)) ||
              undefined,
          });
          setUser(mapUserProfile(saved, updatedUser));
        }}
        onBack={() => setCurrentTab("mypage")}
        onCourses={() => setCurrentTab("courses")}
        onTimetable={() => setCurrentTab("timetable")}
        onMyPage={() => setCurrentTab("mypage")}
      />
    );
  }

  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="timetable-layout relative h-full overflow-hidden">
        <header className="timetable-header px-[14px] pt-[10px]">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-[#a7a7a7]">
                {activeTimetable?.semesterId ?? currentSemesterId}학기
              </p>
              <button
                onClick={() => setOverlay("timetables")}
                className="flex items-center gap-1 text-[17px] font-extrabold"
              >
                {activeTimetable?.name ?? "시간표 없음"}{" "}
                <ChevronDown size={13} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={optimizationLoading}
                onClick={() => setOverlay("auto")}
                className="flex items-center text-[13px] font-bold text-brand disabled:cursor-wait disabled:opacity-60"
              >
                <WandSparkles size={17} />{" "}
                {optimizationLoading ? "편성 중" : "자동편성"}
              </button>
              <button
                type="button"
                onClick={() => setShowFirstLoginTutorial(true)}
                aria-label="튜토리얼 다시 보기"
                title="튜토리얼 다시 보기"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#999] transition hover:bg-brand-soft hover:text-brand"
              >
                <CircleHelp size={18} />
              </button>
            </div>
          </div>
          <Timetable
            selectedCourses={selectedCourses}
            activeCourse={activeCourse}
            focusedCourseId={focusedCourseId}
            onCourseClick={(course) => {
              setActiveCourseId(null);
              setFocusedCourseId((current) =>
                current === course.id ? null : course.id,
              );
            }}
            onToggleCourseLock={toggleCourseLock}
            timeSelections={timeSelections}
            onAddTimeSelection={addTimeSelection}
            onRemoveTimeSelection={removeTimeSelection}
            onToggleTimeSelectionLock={toggleTimeSelectionLock}
            onTimeSelectionStart={() => {
              setActiveCourseId(null);
              setFocusedCourseId(null);
            }}
          />
          {overlay === "timetables" && (
            <TimetableSheet
              items={timetables}
              activeTimetableId={activeTimetableId}
              onAdd={addTimetable}
              onSelect={selectTimetable}
              onRename={renameTimetable}
              onDelete={deleteTimetable}
              onToggleFavorite={toggleTimetableFavorite}
              onDownload={downloadTimetableImage}
              onClose={() => setOverlay(null)}
            />
          )}
        </header>

        <section
          className="course-sheet absolute bottom-[54px] left-0 right-0 z-10 flex rounded-t-[16px] border-t border-[#e1e1e1] bg-white pb-2 transition-[top] duration-300 ease-out"
          style={{ top: sheetExpanded ? "275px" : "509px" }}
        >
          <div className="flex min-h-0 w-full flex-col">
          <div
            className="course-sheet-drag-handle flex h-6 shrink-0 touch-none cursor-grab items-center justify-center active:cursor-grabbing"
            onPointerDown={startSheetDrag}
            onPointerMove={moveSheetDrag}
            onPointerUp={endSheetDrag}
            onPointerCancel={cancelSheetDrag}
            onTouchStart={startSheetTouch}
            onTouchMove={moveSheetTouch}
            onTouchEnd={endSheetTouch}
            onTouchCancel={endSheetTouch}
            onDoubleClick={() => setSheetExpanded((current) => !current)}
          >
            <span className="h-1 w-9 rounded-full bg-[#d7d7db]" />
          </div>
          <div className="course-sheet-filters px-[14px]">
          <div className="no-scrollbar flex cursor-grab gap-2 overflow-x-auto pb-2 active:cursor-grabbing">
            <button
              onClick={(event) => openFilter("major-root", event)}
              className="flex shrink-0 items-center gap-1 rounded-full border border-[#e9e9e9] bg-[#f7f7f7] px-2.5 py-1.5 text-[9px] text-[#999]"
            >
              전공/영역 <ChevronDown size={9} />
            </button>
            {majors.map((value) => (
              <button
                type="button"
                key={value}
                onClick={() =>
                  setMajors((current) =>
                    current.filter((item) => item !== value),
                  )
                }
                className="flex shrink-0 items-center gap-1 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1.5 text-[9px] text-brand"
              >
                {value} <X size={10} />
              </button>
            ))}
            {selectedDepartments.map((department) => (
              <button
                type="button"
                key={department.code}
                onClick={() =>
                  setSelectedDepartments((current) =>
                    current.filter((item) => item.code !== department.code),
                  )
                }
                className="flex shrink-0 items-center gap-1 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1.5 text-[9px] text-brand"
              >
                {department.name} <X size={10} />
              </button>
            ))}
            <button
              onClick={(event) => openFilter("grade", event)}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-[9px] ${
                grades.length || otherGrade ? "border-brand/20 bg-brand-soft text-brand" : "border-[#e9e9e9] bg-[#f7f7f7] text-[#999]"
              }`}
            >
              {gradeLabel}
              {grades.length > 0 || otherGrade ? (
                <X
                  size={10}
                  onClick={(event) => {
                    event.stopPropagation();
                    setGrades([]);
                    setOtherGrade(false);
                  }}
                />
              ) : (
                <ChevronDown size={9} />
              )}
            </button>
            <button
              onClick={(event) => openFilter("sort", event)}
              className="flex shrink-0 items-center gap-1 rounded-full border border-[#e9e9e9] bg-[#f7f7f7] px-2.5 py-1.5 text-[9px] text-[#999]"
            >
              {sort || "정렬"} <ChevronDown size={9} />
            </button>
            <label className="flex min-w-[170px] flex-1 items-center rounded-full border border-[#e9e9e9] bg-[#f7f7f7] px-3">
              <input
                value={query}
                onChange={(event) => {
                  setFocusedCourseId(null);
                  setQuery(event.target.value);
                }}
                placeholder="과목명, 교수명으로 검색"
                className="w-full bg-transparent text-[9px] outline-none placeholder:text-[#999]"
              />
              <Search size={11} className="text-[#888]" />
            </label>
          </div>
          </div>

          <div
            className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-[14px] pb-2"
            onScroll={handleCourseListScroll}
          >
            {timetableSyncError && (
              <div className="flex items-start justify-between gap-2 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-4 text-amber-800">
                <span>{timetableSyncError}</span>
                <button
                  type="button"
                  onClick={() => setTimetableSyncError("")}
                  aria-label="동기화 알림 닫기"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {!focusedCourse && filterResolution.issue && (
              <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-3 text-[11px] leading-4 text-amber-800">
                {filterResolution.issue}
              </div>
            )}
            {!focusedCourse &&
              !filterResolution.issue &&
              coursesLoading &&
              courses.length === 0 && (
              <div className="py-12 text-center text-[12px] text-[#999]">
                강의 목록을 불러오는 중입니다.
              </div>
            )}
            {!focusedCourse &&
              !filterResolution.issue &&
              courseError &&
              courses.length === 0 && (
              <div className="rounded-[12px] border border-red-100 bg-red-50 px-3 py-4 text-center">
                <p className="text-[11px] leading-4 text-red-600">{courseError}</p>
                <button
                  type="button"
                  onClick={retryCourses}
                  className="mt-2 rounded-full border border-red-200 bg-white px-3 py-1 text-[10px] font-semibold text-red-600"
                >
                  다시 시도
                </button>
              </div>
            )}
            {focusedCourse ? (
              <CourseCard
                course={focusedCourse}
                active
                selected
                removable
                onClick={() => {}}
                onRemove={() => removeCourse(focusedCourse.id)}
              />
            ) : (
              !filterResolution.issue &&
              timeFilteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  active={activeCourseId === course.id}
                  selected={selectedCourses.some((item) => item.id === course.id)}
                  onClick={() => {
                    setFocusedCourseId(null);
                    setActiveCourseId(
                      activeCourseId === course.id ? null : course.id,
                    );
                  }}
                  onAdd={() => addCourse(course)}
                />
              ))
            )}
            {!focusedCourse &&
              !filterResolution.issue &&
              !coursesLoading &&
              !coursesLoadingMore &&
              !hasMoreCourses &&
              !courseError &&
              timeFilteredCourses.length === 0 && (
              <div className="py-12 text-center text-[12px] text-[#999]">검색 결과가 없습니다.</div>
            )}
            {!focusedCourse &&
              !filterResolution.issue &&
              courseError &&
              courses.length > 0 && (
              <div className="py-3 text-center">
                <p className="text-[10px] text-red-500">{courseError}</p>
                <button
                  type="button"
                  onClick={retryCourses}
                  className="mt-1 text-[10px] font-semibold text-brand"
                >
                  다시 시도
                </button>
              </div>
            )}
            {!focusedCourse && !filterResolution.issue && coursesLoadingMore && (
              <div className="py-3 text-center text-[10px] text-[#999]">
                다음 강의를 불러오는 중입니다.
              </div>
            )}
          </div>
          </div>
        </section>

        <BottomNavigation
        active="timetable"
        onCourses={() => setCurrentTab("courses")}
        onTimetable={() => {}}
        onMyPage={() => setCurrentTab("mypage")}
      />

        {overlay === "major-root" && (
          <Popover
            title="전공/영역"
            top={236}
            anchor={filterAnchor}
            items={[
              "교양 및 교직과목",
              ...collegeOptions.map((college) => college.name),
              ...(departmentsLoading ? ["학과 목록 불러오는 중"] : []),
              ...(departmentsError ? ["학과 목록을 불러오지 못함"] : []),
            ]}
            onSelect={(value) => {
              if (value === "교양 및 교직과목") {
                setOverlay("major-type");
                return;
              }

              const college = collegeOptions.find(
                (item) => item.name === value,
              );
              if (!college) return;

              setSelectedCollegeCode(college.code);
              setOverlay("major-department");
            }}
            onClose={() => setOverlay(null)}
          />
        )}
        {overlay === "major-department" && (
          <Popover
            title={
              collegeOptions.find(
                (college) => college.code === selectedCollegeCode,
              )?.name ?? "학과 선택"
            }
            top={236}
            anchor={filterAnchor}
            items={selectedCollegeDepartments.map(
              (department) => department.name,
            )}
            selectedItems={selectedDepartments.map(
              (department) => department.name,
            )}
            onBack={() => setOverlay("major-root")}
            onSelect={(value) => {
              const department = selectedCollegeDepartments.find(
                (item) => item.name === value,
              );
              if (!department) return;

              setSelectedDepartments((current) =>
                current.some((item) => item.code === department.code)
                  ? current.filter((item) => item.code !== department.code)
                  : [...current, department],
              );
            }}
            onClose={() => setOverlay(null)}
          />
        )}
        {overlay === "major-type" && (
          <Popover
            title="교양 및 교직과목"
            top={355}
            anchor={filterAnchor}
            items={["교양필수", "교양선택", "교직", "일반선택"]}
            selectedItems={majors.filter((value) =>
              ["교양필수", "교직", "일반선택"].includes(value),
            )}
            onBack={() => setOverlay("major-root")}
            onSelect={(value) => {
              if (value === "교양선택") {
                setOverlay("major-liberal");
              } else {
                addMajorFilter(value);
              }
            }}
            onClose={() => setOverlay(null)}
          />
        )}
        {overlay === "major-liberal" && (
          <Popover
            title="교양선택"
            top={324}
            anchor={filterAnchor}
            items={["인간과 소통", "사회와 경제", "과학과 기술", "예술과 문화", "융합과 혁신", "디지털리터러시"]}
            selectedItems={majors}
            onBack={() => setOverlay("major-type")}
            onSelect={(value) => {
              addMajorFilter(value);
            }}
            onClose={() => setOverlay(null)}
          />
        )}
        {overlay === "grade" && (
          <Popover
            title="학년"
            top={355}
            anchor={filterAnchor}
            items={["1학년", "2학년", "3학년", "4학년", "기타"]}
            selectedItems={[
              ...grades.map((value) => `${value}학년`),
              ...(otherGrade ? ["기타"] : []),
            ]}
            onSelect={(value) => {
              if (value === "기타") {
                setOtherGrade((current) => !current);
                return;
              }
              toggleFilterGrade(Number(value[0]));
            }}
            onClose={() => setOverlay(null)}
          />
        )}
        {overlay === "sort" && (
          <Popover
            title="정렬"
            top={369}
            anchor={filterAnchor}
            items={["기본순", "인기순", "이름순"]}
            selectedItems={[sort || "기본순"]}
            onSelect={(value) => {
              setSort(value === "기본순" ? "" : value);
              setOverlay(null);
            }}
            onClose={() => setOverlay(null)}
          />
        )}
        {overlay === "auto" && (
          <AutoSchedulePanel
            onClose={() => setOverlay(null)}
            onGenerate={(conditions) => {
              setOverlay(null);
              autoGenerate(conditions);
            }}
          />
        )}

        {optimizationLoading && (
          <div className="absolute inset-0 z-[65] flex items-center justify-center bg-black/20 px-8">
            <section
              aria-live="polite"
              className="w-full max-w-[320px] rounded-[16px] bg-white px-6 py-7 text-center shadow-lg"
            >
              <span className="mx-auto block h-7 w-7 animate-spin rounded-full border-[3px] border-[#e7ddff] border-t-brand" />
              <h2 className="mt-4 text-[14px] font-bold">시간표를 편성하고 있어요</h2>
              <p className="mt-2 text-[11px] leading-4 text-[#888]">
                서버에서 조건에 맞는 시간표를 계산하는 중입니다.
              </p>
            </section>
          </div>
        )}

        {optimizationError && (
          <div className="absolute inset-0 z-[65] flex items-center justify-center bg-black/30 px-8">
            <section className="w-full max-w-[320px] rounded-[16px] bg-white px-5 pb-4 pt-5 text-center shadow-lg">
              <h2 className="text-[14px] font-bold">자동편성을 완료하지 못했습니다</h2>
              <p className="mt-2 break-keep text-[11px] leading-5 text-[#777]">
                {optimizationError}
              </p>
              <button
                type="button"
                onClick={() => setOptimizationError(null)}
                className="mt-5 h-[36px] w-full rounded-[10px] bg-brand text-[12px] font-semibold text-white"
              >
                확인
              </button>
            </section>
          </div>
        )}

        {courseConflict && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/30 px-8">
            <section className="w-full max-w-[320px] rounded-[16px] bg-white px-5 pb-4 pt-5 text-center shadow-lg">
              <h2 className="text-[14px] font-bold">
                시간이 겹치는 강의가 있습니다
              </h2>
              <p className="mt-2 text-[11px] leading-4 text-[#777]">
                <span className="font-semibold text-[#444]">
                  {courseConflict.conflicts
                    .map((course) => course.name)
                    .join(", ")}
                </span>
                과(와) 시간이 겹칩니다.
                <br />
                그래도 시간표에 추가하시겠습니까?
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCourseConflict(null)}
                  className="h-[36px] rounded-[10px] border border-[#ddd] text-[12px] text-[#777]"
                >
                  아니오
                </button>
                <button
                  type="button"
                  onClick={() => {
                    commitCourse(courseConflict.course);
                    setCourseConflict(null);
                  }}
                  className="h-[36px] rounded-[10px] bg-brand text-[12px] font-semibold text-white"
                >
                  예
                </button>
              </div>
            </section>
          </div>
        )}

        {showComplete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 px-[93px]">
            <section className="w-full max-w-[360px] rounded-[15px] bg-white px-4 pt-7 text-center shadow-lg">
              <p className="pb-5 text-[12px]">
                시간표 {generatedScheduleCount}개가 생성되었습니다.
                <br />
                <span className="mt-1 inline-block text-[10px] text-[#999]">
                  가장 높은 점수의 시간표를 적용했습니다.
                </span>
              </p>
              <button
                onClick={() => setShowComplete(false)}
                className="w-full border-t border-[#eee] py-3 text-[10px] font-semibold text-brand"
              >
                확인
              </button>
            </section>
          </div>
        )}
      </div>
      {showFirstLoginTutorial && (
        <FirstLoginTutorial
          onComplete={async () => {
            saveTutorialCompletion(user);
            setUser((current) =>
              current
                ? { ...current, tutorialCompleted: true }
                : current,
            );
            setShowFirstLoginTutorial(false);

            try {
              await updateCurrentUser({ tutorialCompleted: true });
            } catch (error) {
              if (error.status !== 401) {
                setTimetableSyncError(
                  error.message ||
                    "튜토리얼 완료 상태를 서버에 저장하지 못했습니다.",
                );
              }
            }
          }}
        />
      )}
    </main>
  );
}
