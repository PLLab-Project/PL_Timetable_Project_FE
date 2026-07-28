import { ArrowLeft, ChevronRight } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";

function totalCredits(timetable) {
  if (timetable.totalCredits !== undefined && timetable.totalCredits !== null) {
    return timetable.totalCredits;
  }

  return timetable.courses.reduce(
    (sum, course) => sum + (Number(course.credits) || 0),
    0,
  );
}

export default function MyTimetableList({
  timetables,
  currentSemesterId,
  onBack,
  onCourses,
  onTimetable,
  onMyPage,
  onSelectTimetable,
}) {
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
                className="mb-4 flex w-full items-center justify-between rounded-xl border border-gray-200 p-5 text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{timetable.name}</h2>
                    {timetable.semesterId === currentSemesterId && (
                      <span className="flex h-6 items-center justify-center whitespace-nowrap rounded-full bg-[#EEEAFE] px-3 text-xs font-medium text-[#6C5CE7]">
                        현재
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {timetable.semesterId}학기 · {totalCredits(timetable)}학점
                    {" · "}
                    {timetable.courses.length}과목
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
