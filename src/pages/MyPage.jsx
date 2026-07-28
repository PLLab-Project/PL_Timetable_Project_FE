import { CalendarDays, Star, Circle, ChevronRight, AlertTriangle } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import { useState } from "react";

function MyPage({ user, onCourses, onTimetable, onMyTimetableList, onFavoriteTimetableList, onAccountInfo, onWithdraw }) {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [agreedToWithdraw, setAgreedToWithdraw] = useState(false);

  const menuItems = [
    { icon: CalendarDays, label: "내 시간표 확인", onClick: onMyTimetableList },
    { icon: Star, label: "즐겨찾기 시간표", onClick: onFavoriteTimetableList },
    { icon: Circle, label: "계정정보 확인/변경", onClick: onAccountInfo },
  ];

  const handleWithdraw = () => {
    setShowWithdrawModal(false);
    setAgreedToWithdraw(false);
    onWithdraw();
  };
  
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
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full py-5 text-left">
            <span className="font-medium text-red-500">회원탈퇴</span>
          </button>
        </div>
        {/* 회원탈퇴 확인 모달 */}
        {showWithdrawModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35">
            <section className="w-[290px] rounded-2xl bg-white px-6 py-7 text-center shadow-lg">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <p className="mt-4 text-base font-semibold">정말 탈퇴하시겠어요?</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">
                탈퇴하면 계정 정보와 저장된 모든 시간표가
                <br />
                삭제되며 복구할 수 없어요.
              </p>

              <label className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={agreedToWithdraw}
                  onChange={(event) => setAgreedToWithdraw(event.target.checked)}
                  className="h-4 w-4"
                />
                위 내용을 확인했으며 탈퇴에 동의합니다
              </label>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setAgreedToWithdraw(false);
                  }}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-500"
                >
                  취소
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={!agreedToWithdraw}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white ${
                    agreedToWithdraw ? "bg-red-600" : "bg-red-200"
                  }`}
                >
                  탈퇴하기
                </button>
              </div>
            </section>
          </div>
          )}
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