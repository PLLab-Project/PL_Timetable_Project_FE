import { ArrowLeft } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import ReadOnlyTimetableGrid from "../components/ReadOnlyTimetableGrid";

export default function MyTimetableDetail({
  timetables,
  timetableId,
  onBack,
  onCourses,
  onTimetable,
  onMyPage,
}) {
  const timetable = timetables.find((item) => item.id === timetableId);

  if (!timetable) return null;

  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="my-courses-page relative h-full overflow-hidden">
        <div className="my-courses-content no-scrollbar h-full overflow-y-auto px-[14px] pb-[80px] pt-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} aria-label="뒤로가기">
              <ArrowLeft size={16} className="text-black" />
            </button>
            <div>
              <p className="text-[10px] text-[#a7a7a7]">
                {timetable.semesterId}학기
              </p>
              <h1 className="text-[17px] font-bold">{timetable.name}</h1>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[560px]">
            <ReadOnlyTimetableGrid courses={timetable.courses} />
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
