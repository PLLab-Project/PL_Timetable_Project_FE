import { CalendarDays, Star, Circle, ChevronRight } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";

function MyPage({ onCourses, onTimetable, onMyTimetableList }) {
  // TODO: 백엔드 API 연결 후 실제 사용자 정보로 변경
  const user = {
    name: "홍길동",
    studentId: "20221234",
    major: "컴퓨터공학과",
    grade: 3,
  };

  const menuItems = [
    { icon: CalendarDays, label: "내 시간표 확인", onClick: onMyTimetableList },
    { icon: Star, label: "즐겨찾기 시간표" },
    { icon: Circle, label: "계정정보 확인/변경" },
  ];

  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="my-courses-page relative h-full overflow-hidden">
        <div className="my-courses-content no-scrollbar h-full overflow-y-auto px-[14px] pb-[80px] pt-6">
          {/* 페이지 제목 */}
          <h1 className="text-xl font-bold">마이페이지</h1>

          {/* 프로필 카드 */}
          <div className="mt-6 h-44 w-full rounded-xl bg-[#6C4FD9] p-6">
            <div className="flex items-center gap-4">
              {/* TODO: 백엔드에서 프로필 사진 URL을 받아오면 img 태그로 변경 */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                <span className="text-2xl text-[#6C4FD9]">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-white">{user.name}</p>
                <p className="text-sm text-white">{user.studentId}</p>
                <p className="text-sm text-[#E1DCF9]">
                  {user.major} {user.grade}학년
                </p>
              </div>
            </div>
          </div>

          {/* 메뉴 영역 */}
          <div className="mt-8">
            {menuItems.map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex w-full items-center justify-between border-b border-gray-200 py-5"
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-[#6C4FD9]" />
                  <span className="text-base font-medium">{label}</span>
                </div>
                <ChevronRight size={12} className="text-gray-400" />
              </button>
            ))}

            {/* 회원탈퇴 */}
            <button className="w-full py-5 text-left">
              <span className="font-medium text-red-500">회원탈퇴</span>
            </button>
          </div>
        </div>

        <BottomNavigation
          active="mypage"
          onCourses={onCourses}
          onTimetable={onTimetable}
          onMyPage={() => {}}
        />
      </div>
    </main>
  );
}

export default MyPage;