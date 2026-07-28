import { ArrowLeft, ChevronRight, Star } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import { timetables } from "./MyTimeTableList";

export default function MyFavoriteTimetableList({ onBack, onCourses, onTimetable, onMyPage, onSelectTimetable }) {
  const favoriteTimetables = timetables.filter((timetable) => timetable.favorite);

  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="my-courses-page relative h-full overflow-hidden">
        <div className="my-courses-content no-scrollbar h-full overflow-y-auto px-[14px] pb-[80px] pt-6">
          {/* 상단 헤더 */}
          <div className="flex items-center gap-4">
            <button onClick={onBack} aria-label="뒤로가기">
              <ArrowLeft size={16} className="text-black" />
            </button>
            <h1 className="text-xl font-bold">즐겨찾기 시간표</h1>
          </div>

          {favoriteTimetables.length === 0 ? (
            <div className="mt-24 flex flex-col items-center text-center">
              <Star size={28} className="text-gray-300" />
              <p className="mt-4 text-sm font-medium text-gray-700">
                즐겨찾기한 시간표가 없어요
              </p>
              <p className="mt-1 text-xs text-gray-400">
                시간표 화면에서 별 아이콘을 눌러 마음에 드는
                <br />
                시간표를 저장해보세요.
              </p>
            </div>
          ) : (
            <div className="mt-8">
              {favoriteTimetables.map((timetable) => (
                <button
                  key={timetable.id}
                  onClick={() => onSelectTimetable(timetable.id)}
                  className="mb-4 flex w-full items-center justify-between rounded-xl border border-gray-200 p-5"
                >
                  <div>
                    <h2 className="text-lg font-bold">{timetable.semester}</h2>
                    <p className="mt-2 text-sm text-gray-500">
                      {timetable.credit}학점 · {timetable.subjectCount}과목
                    </p>
                  </div>
                  <ChevronRight size={12} className="text-gray-400" />
                </button>
              ))}
            </div>
          )}
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