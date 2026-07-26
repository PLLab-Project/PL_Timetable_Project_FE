import { CalendarDays, Circle, LayoutList } from "lucide-react";

export default function BottomNavigation({ active, onCourses, onTimetable, onMyPage }) {
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
      <button className={itemClass("mypage")} onClick={onMyPage}>
        <Circle size={16} /> 마이페이지
      </button>
    </nav>
  );
}