import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Circle,
  Download,
  GraduationCap,
  ImagePlus,
  LayoutList,
  WandSparkles,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";

const DAYS = ["월", "화", "수", "목", "금"];
const TIMES = ["9", "10", "11", "12", "1", "2", "3", "4", "5", "6"];
const COLORS = ["#F0C92D", "#75C6A8", "#F09A86", "#78A7E8", "#B997E8"];

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

function Timetable({ selectedIds, activeCourseId }) {
  const selected = initialCourses.filter((course) => selectedIds.includes(course.id));
  const previewCourse = initialCourses.find(
    (course) => course.id === activeCourseId,
  );

  return (
    <div className="timetable-grid relative mt-2 h-[442px] overflow-hidden rounded-[15px] border border-[#d9d9d9] bg-white">
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
      {!previewCourse && selected.map((course, index) => (
        <div
          key={course.id}
          className="absolute overflow-hidden px-1 py-1 text-[9px] font-medium leading-[1.25] text-white"
          style={{
            background: COLORS[index % COLORS.length],
            left: `calc(13px + ${course.day} * ((100% - 13px) / 5))`,
            top: `calc(14px + ${course.start * 10}% - ${course.start * 1.4}px)`,
            width: "calc((100% - 13px) / 5)",
            height: `calc(${course.span * 10}% - ${course.span * 1.4}px)`,
          }}
        >
          <p className="line-clamp-2 text-[10px] font-bold">{course.name}</p>
          <p>{course.professor}</p>
          <p className="truncate">{course.room}</p>
        </div>
      ))}
      {previewCourse &&
        (previewCourse.previewDays || [previewCourse.day]).map((day) => (
          <div
            key={`preview-${previewCourse.id}-${day}`}
            className="absolute bg-[#f1edff]"
            style={{
              left: `calc(13px + ${day} * ((100% - 13px) / 5))`,
              top: `calc(14px + ${previewCourse.start * 10}% - ${previewCourse.start * 1.4}px)`,
              width: "calc((100% - 13px) / 5)",
              height: `calc(${previewCourse.span * 10}% - ${previewCourse.span * 1.4}px)`,
            }}
          />
        ))}
    </div>
  );
}

function CourseCard({ course, active, selected, onClick, onAdd }) {
  return (
    <article
      onClick={onClick}
      className={`h-[76px] cursor-pointer overflow-hidden rounded-[14px] border px-[9px] py-[6px] transition ${
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
        {active && !selected && (
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
        )}
        {selected && <span className="shrink-0 text-[9px] font-semibold text-brand">추가됨</span>}
      </div>
      <p className="mt-0.5 truncate text-[9px] leading-[10px] text-[#aaa]">{course.time}</p>
      <p className="truncate text-[9px] leading-[10px] text-[#aaa]">강의 {course.room}</p>
      <div className="mt-0.5 flex items-end justify-between gap-2">
        <p className="truncate text-[9px] leading-[10px] text-[#aaa]">{course.meta}</p>
        <p className={`max-w-[52%] truncate text-[8px] leading-[10px] ${active ? "text-brand" : "text-[#999]"}`}>
          비고: {course.note}
        </p>
      </div>
    </article>
  );
}

function TimetableSheet({ onClose }) {
  const [favorite, setFavorite] = useState(1);
  const [items, setItems] = useState([1, 2, 3, 4]);
  const [closing, setClosing] = useState(false);
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
          <button className="flex items-center gap-1 text-[13px] text-[#777]">
            <Plus size={15} /> 시간표 추가
          </button>
        </div>
        {items.map((item) => (
          <div key={item} className="flex h-[37px] items-center border-t border-[#eee]">
            <button onClick={() => setFavorite(item)} aria-label="즐겨찾기">
              <Star
                size={14}
                className={favorite === item ? "fill-[#f6c900] text-[#f6c900]" : "text-[#bbb]"}
              />
            </button>
            <button className="ml-2 flex-1 text-left text-[12px] font-semibold" onClick={handleClose}>
              시간표 {item}
            </button>
            <div className="flex gap-3 text-[#999]">
              <Download size={14} />
              <Pencil size={14} />
              <button
                aria-label="시간표 삭제"
                onClick={() => setItems((current) => current.filter((value) => value !== item))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </section>
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
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onSelect(item)}
            className={`block w-full border-t border-white/20 py-2 text-[11px] ${
              selectedItems.includes(item) ? "font-semibold text-brand" : ""
            }`}
          >
            {item}
          </button>
        ))}
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

function BottomNavigation({ active, onCourses, onTimetable }) {
  const itemClass = (name) =>
    `flex flex-col items-center justify-center gap-0.5 text-[10px] ${
      active === name ? "font-semibold text-brand" : "text-[#999]"
    }`;

  return (
    <nav className="app-bottom-navigation absolute bottom-0 left-0 z-20 grid h-[54px] w-full grid-cols-3 border-t border-[#e5e5e5] bg-white">
      <button className={itemClass("courses")} onClick={onCourses}>
        <LayoutList size={17} /> 내 강의
      </button>
      <button className={itemClass("timetable")} onClick={onTimetable}>
        <CalendarDays size={17} /> 시간표
      </button>
      <button className={itemClass("mypage")}>
        <Circle size={16} /> 마이페이지
      </button>
    </nav>
  );
}

const importedCourses = [
  { id: 101, name: "운영체제론", area: "전공선택", credits: "3학점" },
  { id: 102, name: "게임프로그래밍", area: "전공선택", credits: "3학점" },
  { id: 103, name: "컴퓨터알고리즘", area: "전공선택", credits: "3학점" },
  { id: 104, name: "사회복지조사론", area: "전공선택", credits: "3학점" },
  { id: 105, name: "알면좋은한국사", area: "교양선택 · 5영역", credits: "2학점" },
];

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

function CourseInputForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [area, setArea] = useState(initial?.area || "");
  const [credits, setCredits] = useState(initial?.credits || "");
  const [openMenu, setOpenMenu] = useState(null);
  const [showLiberalAreas, setShowLiberalAreas] = useState(
    courseLiberalAreaOptions.includes(initial?.area),
  );
  const areaMenuRef = useRef(null);
  const creditsMenuRef = useRef(null);

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
      <label className="block text-[10px] text-[#777]">과목명</label>
      <div className="flex h-[31px] items-center border-b border-[#ddd]">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="과목명을 입력하세요"
          className="min-w-0 flex-1 text-[13px] outline-none placeholder:text-[#aaa]"
        />
        <Search size={12} className="text-[#888]" />
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
          onClick={() => name.trim() && onSave({ name: name.trim(), area, credits })}
          className="h-[31px] rounded-[11px] bg-brand px-5 text-[12px] font-semibold text-white"
        >
          저장
        </button>
      </div>
    </section>
  );
}

function GraduationModal({ onClose }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 px-6" onClick={onClose}>
      <section
        className="w-full max-w-[354px] rounded-[15px] bg-white px-6 pb-3 pt-7 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between text-[13px] font-bold">
          <span>전체</span>
          <span>91 / 126 학점</span>
        </div>
        <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-[#ececee]">
          <div className="h-full w-[75%] rounded-full bg-brand" />
        </div>

        <div className="ml-1 mt-2 border-l-2 border-[#e7e7e7] pl-3 text-[10px]">
          <div className="flex justify-between font-semibold">
            <span>전공 <span className="font-normal text-[#999]">(최소 63학점)</span></span>
            <span>42/63 학점</span>
          </div>
          <div className="mt-1 h-[5px] overflow-hidden rounded-full bg-[#ececee]">
            <div className="h-full w-[78%] rounded-full bg-brand" />
          </div>
          <div className="mt-2 space-y-2">
            <p>전공필수　 6/12 학점</p>
            <p>전공선택　 36/30 학점</p>
            <p className="pt-1 font-semibold">
              교양 <span className="font-normal text-[#999]">(최대 46학점까지 인정)</span>
            </p>
            <p>교양필수　 13/12 학점</p>
            <p>전공선택　 30/24 학점</p>
          </div>
        </div>

        <div className="mt-7 text-[10px]">
          <h3 className="mb-3 text-[12px] font-bold">남은 필수 과목</h3>
          <div className="space-y-3">
            <p>· 졸업논문 (캡스톤디자인2)</p>
            <p>· 교양선택 2영역</p>
            <p>· 전공필수 (운영체제론)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full border-t border-[#eee] py-3 text-[15px] font-semibold text-brand"
        >
          확인
        </button>
      </section>
    </div>
  );
}

function MyCoursesPage({ onTimetable }) {
  const [courses, setCourses] = useState([]);
  const [drafts, setDrafts] = useState([
    { key: "initial", editingId: null, initial: null },
  ]);
  const [showGraduation, setShowGraduation] = useState(false);

  const saveCourse = (draft, values) => {
    const nextCourse = {
      id: draft.editingId || Date.now(),
      name: values.name,
      area: values.area || "영역 미선택",
      credits: values.credits || "학점 미선택",
    };
    setCourses((current) =>
      draft.editingId
        ? current.map((course) => (course.id === draft.editingId ? nextCourse : course))
        : [...current, nextCourse],
    );
    setDrafts((current) => current.filter((item) => item.key !== draft.key));
  };

  const editCourse = (course) => {
    setDrafts((current) => {
      if (current.some((draft) => draft.editingId === course.id)) return current;
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
          onClick={() => setCourses(importedCourses)}
          className="mt-7 flex h-[53px] w-full flex-col items-center justify-center rounded-[14px] border border-brand text-brand"
        >
          <span className="flex items-center gap-1 text-[15px] font-semibold">
            <ImagePlus size={14} /> 이미지로 가져오기
          </span>
          <span className="mt-0.5 text-[10px] text-[#aaa]">에타 시간표로 편하게 입력하세요</span>
        </button>

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
              onSave={(values) => saveCourse(draft, values)}
              onCancel={() =>
                setDrafts((current) =>
                  current.filter((item) => item.key !== draft.key),
                )
              }
            />
          ))}
        </div>

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
                onClick={() =>
                  setCourses((current) => current.filter((item) => item.id !== course.id))
                }
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
        />
        {showGraduation && <GraduationModal onClose={() => setShowGraduation(false)} />}
      </div>
    </main>
  );
}

export default function App() {
  const [currentTab, setCurrentTab] = useState("timetable");
  const [selectedIds, setSelectedIds] = useState([1, 2]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [query, setQuery] = useState("");
  const [majors, setMajors] = useState([]);
  const [grades, setGrades] = useState([]);
  const [otherGrade, setOtherGrade] = useState(false);
  const [sort, setSort] = useState("");
  const [overlay, setOverlay] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [showComplete, setShowComplete] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const dragStartY = useRef(null);
  const dragStartX = useRef(null);
  const dragPointerId = useRef(null);

  const courses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = initialCourses.filter(
      (course) =>
        !normalized ||
        course.name.toLowerCase().includes(normalized) ||
        course.professor.toLowerCase().includes(normalized),
    );
    if (sort === "이름순") return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    if (sort === "인기순") return [...filtered].reverse();
    return filtered;
  }, [query, sort]);

  const addCourse = (id) => {
    setSelectedIds((current) => (current.includes(id) ? current : [...current, id]));
    setActiveCourse(null);
  };

  const autoGenerate = () => {
    setSelectedIds([1, 2, 4]);
    setShowComplete(true);
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
      current.includes(value) ? current : [...current, value],
    );
  };

  const openFilter = (name, event) => {
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

  if (currentTab === "courses") {
    return <MyCoursesPage onTimetable={() => setCurrentTab("timetable")} />;
  }

  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="timetable-layout relative h-full overflow-hidden">
        <header className="timetable-header px-[14px] pt-[10px]">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-[#a7a7a7]">2026-2학기</p>
              <button
                onClick={() => setOverlay("timetables")}
                className="flex items-center gap-1 text-[17px] font-extrabold"
              >
                시간표 1 <ChevronDown size={13} strokeWidth={2.5} />
              </button>
            </div>
            <button onClick={() => setOverlay("auto")} className="flex items-center text-[13px] font-bold text-brand">
          <WandSparkles size={17} /> 자동편성
            </button>
          </div>
          <Timetable
            selectedIds={selectedIds}
            activeCourseId={activeCourse}
          />
          {overlay === "timetables" && (
            <TimetableSheet onClose={() => setOverlay(null)} />
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
                onChange={(event) => setQuery(event.target.value)}
                placeholder="과목명, 교수명으로 검색"
                className="w-full bg-transparent text-[9px] outline-none placeholder:text-[#999]"
              />
              <Search size={11} className="text-[#888]" />
            </label>
          </div>
          </div>

          <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-[14px] pb-2">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                active={activeCourse === course.id}
                selected={false}
                onClick={() =>
                  setActiveCourse(activeCourse === course.id ? null : course.id)
                }
                onAdd={() => addCourse(course.id)}
              />
            ))}
            {courses.length === 0 && (
              <div className="py-12 text-center text-[12px] text-[#999]">검색 결과가 없습니다.</div>
            )}
          </div>
          </div>
        </section>

        <BottomNavigation
          active="timetable"
          onCourses={() => setCurrentTab("courses")}
          onTimetable={() => {}}
        />

        {overlay === "major-root" && (
          <Popover
            title="전공/영역"
            top={236}
            anchor={filterAnchor}
            items={[
              "교양 및 교직과목",
              "대순종대학",
              "인문예술대학",
              "글로벌산업통상대학",
              "공공인재대학",
              "보건과학대학",
              "AI융합대학",
              "공과대학",
              "상생교양대학",
              "미래평생교육융합대학",
              "국제협력대학",
              "융합전공",
            ]}
            onSelect={(value) => {
              if (value === "교양 및 교직과목") {
                setOverlay("major-type");
              } else {
                addMajorFilter(value);
                setOverlay(null);
              }
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
            onBack={() => setOverlay("major-root")}
            onSelect={(value) => {
              if (value === "교양선택") {
                setOverlay("major-liberal");
              } else {
                addMajorFilter(value);
                setOverlay(null);
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
              setOverlay(null);
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
            onGenerate={() => {
              setOverlay(null);
              autoGenerate();
            }}
          />
        )}

        {showComplete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 px-[93px]">
            <section className="w-full max-w-[360px] rounded-[15px] bg-white px-4 pt-7 text-center shadow-lg">
              <p className="pb-5 text-[12px]">시간표 3개가 생성되었습니다.</p>
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
    </main>
  );
}
