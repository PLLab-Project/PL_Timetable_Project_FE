import { useState } from "react";
import { ArrowLeft } from "lucide-react";

const MAJORS = [
  "컴퓨터공학전공",
  "소프트웨어학과",
  "전자공학과",
  "산업공학과",
];

export default function SignupInfoPage({
  googleProfile,
  onComplete,
  onBack,
}) {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [majorQuery, setMajorQuery] = useState("");
  const [major, setMajor] = useState("");
  const [grade, setGrade] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const filtered = MAJORS.filter((m) => m.includes(majorQuery));
  const canSubmit = name && studentId && major && grade;

  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="my-courses-page relative h-full overflow-hidden">
        <div className="my-courses-content no-scrollbar h-full overflow-y-auto p-6">

          <button onClick={onBack} className="mb-6">
            <ArrowLeft />
          </button>

          <h1 className="text-xl font-bold mb-1">
            처음 오셨네요!
          </h1>

          <p className="text-gray-500 mb-8">
            바로 시작할 수 있게 몇 가지만 알려주세요
          </p>

          <div className="mb-6">
            <label className="text-sm font-medium">이름</label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={googleProfile?.name ?? "홍길동"}
              className="w-full border-b py-2 outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium">학번</label>

            <input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder={googleProfile?.studentId ?? "20221234"}
              className="w-full border-b py-2 outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="mb-6 relative">
            <label className="text-sm font-medium">학과</label>

            <input
              value={majorQuery}
              onChange={(e) => {
                setMajorQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="학과를 입력하세요"
              className="w-full border-b py-2 outline-none"
            />

            {showResults && majorQuery && (
              <ul className="absolute bg-white border rounded-md w-full mt-1 shadow z-10">
                {filtered.map((m) => (
                  <li
                    key={m}
                    onClick={() => {
                      setMajor(m);
                      setMajorQuery(m);
                      setShowResults(false);
                    }}
                    className="px-4 py-2 hover:bg-purple-50 cursor-pointer"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-10">
            <label className="text-sm font-medium">학년</label>

            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4].map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`flex-1 border rounded-full py-2 text-sm ${
                    grade === g
                      ? "border-purple-600 text-purple-600"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!canSubmit}
            onClick={() =>
              onComplete({
                name,
                studentId,
                major,
                grade,
              })
            }
            className={`w-full rounded-full py-3 font-medium ${
              canSubmit
                ? "bg-[#6C4FD9] text-white"
                : "bg-[#EAE4FB] text-[#B3A6E8]"
            }`}
          >
            시작하기
          </button>

        </div>
      </div>
    </main>
  );
}