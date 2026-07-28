import { ArrowLeft, ChevronRight } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";

// TODO: 백엔드 API 연결 후 실제 시간표 목록으로 변경
const timetables = [
  {
    id: 1,
    semester: "2026-2학기",
    credit: 13,
    subjectCount: 5,
    current: true,
    favorite: false,
    courses: [
      { id: 1, name: "프론트엔드 웹디자인", professor: "김정민", room: "A409-웹스토리지인실습실", day: 2, start: 0.5, span: 1.5, color: "#E7C332" },
      { id: 2, name: "프론트엔드 웹디자인", professor: "김정민", room: "A409-웹스토리지인실습실", day: 3, start: 0.5, span: 1.5, color: "#E7C332" },
      { id: 3, name: "피드 웹디자인", professor: "김정민", room: "A409-웹스토리지인실습실", day: 2, start: 4, span: 2, color: "#75C6A8" },
      { id: 4, name: "UX 디자인 기초", professor: "이수현", room: "B201 디자인실", day: 1, start: 2, span: 2, color: "#F09A86" },
      { id: 5, name: "디지털리터러시", professor: "박지훈", room: "C301", day: 0, start: 5, span: 2, color: "#78A7E8" },
      { id: 6, name: "웹 프로그래밍", professor: "최유진", room: "A402", day: 4, start: 6, span: 3, color: "#B997E8" },
    ],
  },
  {
    id: 2,
    semester: "2025-2학기",
    credit: 8,
    subjectCount: 3,
    current: false,
    favorite: false,
    courses: [
      { id: 1, name: "프론트엔드 웹디자인", professor: "김정민", room: "A409-웹스토리지인실습실", day: 2, start: 0.5, span: 1.5, color: "#E7C332" },
      { id: 2, name: "프론트엔드 웹디자인", professor: "김정민", room: "A409-웹스토리지인실습실", day: 3, start: 0.5, span: 1.5, color: "#E7C332" },
      { id: 4, name: "UX 디자인 기초", professor: "이수현", room: "B201 디자인실", day: 1, start: 2, span: 2, color: "#F09A86" },
    ],
  },
  {
    id: 3,
    semester: "2025-1학기",
    credit: 8,
    subjectCount: 3,
    current: false,
    favorite: true,
    courses: [
      { id: 3, name: "피드 웹디자인", professor: "김정민", room: "A409-웹스토리지인실습실", day: 2, start: 4, span: 2, color: "#75C6A8" },
      { id: 5, name: "디지털리터러시", professor: "박지훈", room: "C301", day: 0, start: 5, span: 2, color: "#78A7E8" },
      { id: 6, name: "웹 프로그래밍", professor: "최유진", room: "A402", day: 4, start: 6, span: 3, color: "#B997E8" },
    ],
  },
];

export default function MyTimetableList({ onBack, onCourses, onTimetable, onMyPage, onSelectTimetable }) {
  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="my-courses-page relative h-full overflow-hidden">
        <div className="my-courses-content no-scrollbar h-full overflow-y-auto px-[14px] pb-[80px] pt-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} aria-label="뒤로가기">
              <ArrowLeft size={16} className="text-black" />
            </button>
            <h1 className="text-xl font-bold">내 시간표</h1>
          </div>

          <div className="mt-8">
            {timetables.map((timetable) => (
              <button
                key={timetable.id}
                onClick={() => onSelectTimetable(timetable.id)}
                className="mb-4 flex w-full items-center justify-between rounded-xl border border-gray-200 p-5"
              >
                <div>
                  <div className="relative">
                    <h2 className="text-lg font-bold">{timetable.semester}</h2>
                    {timetable.current && (
                      <span className="absolute left-[110px] top-0 flex h-6 items-center justify-center whitespace-nowrap rounded-full bg-[#EEEAFE] px-3 text-xs font-medium text-[#6C5CE7]">
                        현재
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {timetable.credit}학점 · {timetable.subjectCount}과목
                  </p>
                </div>
                <ChevronRight size={12} className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        <BottomNavigation
          active="mypage"
          onCourses={onCourses}
          onTimetable={onTimetable}
          onMyPage={onMyPage}
        />
      </div>
    </main>
  );
}

export { timetables };