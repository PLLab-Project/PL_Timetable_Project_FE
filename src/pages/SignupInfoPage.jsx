import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getDepartments } from "../api/departments";

export default function SignupInfoPage({
  googleProfile,
  onComplete,
  onBack,
}) {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [majorQuery, setMajorQuery] = useState("");
  const [major, setMajor] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState(null);
  const [grade, setGrade] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const canSubmit = name && studentId && major && grade;

  useEffect(() => {
    const query = majorQuery.trim();

    if (!query) {
      setDepartments([]);
      setDepartmentsLoading(false);
      setDepartmentsError(null);
      return undefined;
    }

    if (major?.name === query) {
      setDepartments([major]);
      setDepartmentsLoading(false);
      setDepartmentsError(null);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setDepartmentsLoading(true);
      setDepartmentsError(null);

      getDepartments(
        {
          query,
          currentOnly: true,
          page: 0,
          size: 20,
        },
        controller.signal,
      )
        .then((result) => {
          setDepartments(result?.items ?? []);
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          setDepartments([]);
          setDepartmentsError(
            error.message || "학과 목록을 불러오지 못했습니다.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setDepartmentsLoading(false);
          }
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [major, majorQuery]);

  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="signup-page my-courses-page relative h-full overflow-hidden">
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
                setMajor(null);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="학과를 입력하세요"
              className="w-full border-b py-2 outline-none"
            />

            {showResults && majorQuery && (
              <ul className="absolute left-0 top-full z-10 -mt-px max-h-[220px] w-full overflow-y-auto rounded-md border bg-white shadow">
                {departmentsLoading && (
                  <li className="px-4 py-2 text-sm text-gray-400">
                    학과를 검색하고 있습니다.
                  </li>
                )}
                {!departmentsLoading && departmentsError && (
                  <li className="px-4 py-2 text-sm text-red-500">
                    학과 목록을 불러오지 못했습니다.
                  </li>
                )}
                {!departmentsLoading &&
                  !departmentsError &&
                  departments.length === 0 && (
                    <li className="px-4 py-2 text-sm text-gray-400">
                      검색 결과가 없습니다.
                    </li>
                  )}
                {!departmentsLoading &&
                  !departmentsError &&
                  departments.map((department) => (
                  <li
                    key={department.code}
                    onClick={() => {
                      setMajor(department);
                      setMajorQuery(department.name);
                      setShowResults(false);
                    }}
                    className="px-4 py-2 hover:bg-purple-50 cursor-pointer"
                  >
                    <span className="block text-sm text-[#333]">
                      {department.name}
                    </span>
                    {department.collegeName && (
                      <span className="mt-0.5 block text-[11px] text-gray-400">
                        {department.collegeName}
                      </span>
                    )}
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
                major: major.name,
                departmentCode: major.code,
                collegeName: major.collegeName,
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
