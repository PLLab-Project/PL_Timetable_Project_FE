import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";

export default function MyAccountInfo({ user, onSave, onBack, onCourses, onTimetable, onMyPage }) {
  const [major, setMajor] = useState(user.major);
  const [studentId, setStudentId] = useState(user.studentId);
  const [grade, setGrade] = useState(`${user.grade}학년`);
  const [name, setName] = useState(user.name);
  const [showSavedModal, setShowSavedModal] = useState(false);

  const handleSave = () => {
    setShowSavedModal(true);
  };

  const handleConfirm = () => {
    setShowSavedModal(false);
    onSave({
      name,
      studentId,
      major,
      grade: parseInt(grade, 10) || user.grade,
    });
  };

  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="my-courses-page relative h-full overflow-hidden">
        <div className="my-courses-content no-scrollbar h-full overflow-y-auto px-[14px] pb-[80px] pt-6">
          {/* 상단 헤더 */}
          <div className="flex items-center gap-4">
            <button onClick={onBack} aria-label="뒤로가기">
              <ArrowLeft size={16} className="text-black" />
            </button>
            <h1 className="text-xl font-bold">계정정보 확인/변경</h1>
          </div>

          {/* 프로필 */}
          <div className="mt-8 flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EEEAFE]">
              <span className="text-2xl text-[#6C4FD9]">{name.charAt(0)}</span>
            </div>
            <p className="mt-3 text-lg font-bold">{name}</p>
          </div>

          {/* 입력 폼 */}
          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-1 block text-sm text-gray-500">학과</label>
              <input
                value={major}
                onChange={(event) => setMajor(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6C4FD9]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">학번</label>
              <input
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6C4FD9]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">학년</label>
              <input
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6C4FD9]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">이름</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6C4FD9]"
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-500"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-[#6C4FD9] py-3 text-sm font-semibold text-white"
            >
              저장
            </button>
          </div>
        </div>

        {/* 저장 완료 모달 */}
        {showSavedModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35">
            <section className="w-[290px] rounded-2xl bg-white px-6 py-8 text-center shadow-lg">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3DE]">
                <span className="text-xl text-[#3B6D11]">✓</span>
              </div>
              <p className="mt-4 text-base font-semibold">저장되었습니다</p>
              <p className="mt-1 text-xs text-gray-400">계정 정보가 변경되었어요.</p>
              <button
                onClick={handleConfirm}
                className="mt-5 w-full rounded-full bg-[#6C4FD9] py-2.5 text-sm font-semibold text-white"
              >
                확인
              </button>
            </section>
          </div>
        )}

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