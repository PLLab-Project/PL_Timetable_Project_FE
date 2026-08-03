import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getDepartments } from "../api/departments";

const PROGRAM_PATH_OPTIONS = [
  { value: "ADVANCED_MAJOR", label: "단일전공" },
  { value: "DOUBLE_MAJOR", label: "복수전공" },
  { value: "MINOR", label: "부전공" },
];

export default function SignupInfoPage({
  googleProfile,
  onComplete,
  onBack,
}) {
  const [name, setName] = useState(googleProfile?.name ?? "");
  const [studentId, setStudentId] = useState(
    googleProfile?.studentId ?? "",
  );
  const [majorQuery, setMajorQuery] = useState("");
  const [major, setMajor] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState(null);
  const [programPath, setProgramPath] = useState("ADVANCED_MAJOR");
  const [secondaryMajorQuery, setSecondaryMajorQuery] = useState("");
  const [secondaryMajor, setSecondaryMajor] = useState(null);
  const [secondaryDepartments, setSecondaryDepartments] = useState([]);
  const [secondaryDepartmentsLoading, setSecondaryDepartmentsLoading] =
    useState(false);
  const [secondaryDepartmentsError, setSecondaryDepartmentsError] =
    useState(null);
  const [showSecondaryResults, setShowSecondaryResults] = useState(false);
  const [grade, setGrade] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const needsSecondaryMajor = programPath !== "ADVANCED_MAJOR";
  const canSubmit =
    name &&
    studentId &&
    major &&
    grade &&
    (!needsSecondaryMajor || secondaryMajor);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      await onComplete({
        name: name.trim(),
        studentId: studentId.trim(),
        major: major.name,
        departmentCode: major.code,
        collegeName: major.collegeName,
        programPath,
        secondaryMajor: secondaryMajor?.name ?? "",
        secondaryDepartmentCode: secondaryMajor?.code ?? "",
        secondaryCollegeName: secondaryMajor?.collegeName ?? "",
        grade,
      });
    } catch (error) {
      setSubmitError(
        error.message || "사용자 정보를 저장하지 못했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

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

  useEffect(() => {
    const query = secondaryMajorQuery.trim();

    if (!needsSecondaryMajor || !query) {
      setSecondaryDepartments([]);
      setSecondaryDepartmentsLoading(false);
      setSecondaryDepartmentsError(null);
      return undefined;
    }

    if (secondaryMajor?.name === query) {
      setSecondaryDepartments([secondaryMajor]);
      setSecondaryDepartmentsLoading(false);
      setSecondaryDepartmentsError(null);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSecondaryDepartmentsLoading(true);
      setSecondaryDepartmentsError(null);

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
          setSecondaryDepartments(
            (result?.items ?? []).filter(
              (department) => department.code !== major?.code,
            ),
          );
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          setSecondaryDepartments([]);
          setSecondaryDepartmentsError(
            error.message || "학과 목록을 불러오지 못했습니다.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setSecondaryDepartmentsLoading(false);
          }
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [major?.code, needsSecondaryMajor, secondaryMajor, secondaryMajorQuery]);

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
            <label className="text-sm font-medium">주전공</label>

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
                      if (secondaryMajor?.code === department.code) {
                        setSecondaryMajor(null);
                        setSecondaryMajorQuery("");
                      }
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

          <div className="mb-6">
            <label className="text-sm font-medium">
              복수전공·부전공 여부
            </label>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {PROGRAM_PATH_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  aria-pressed={programPath === option.value}
                  onClick={() => {
                    setProgramPath(option.value);
                    if (option.value === "ADVANCED_MAJOR") {
                      setSecondaryMajor(null);
                      setSecondaryMajorQuery("");
                      setShowSecondaryResults(false);
                    }
                  }}
                  className={`rounded-full border py-2 text-sm transition-colors ${
                    programPath === option.value
                      ? "border-purple-600 text-purple-600"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {needsSecondaryMajor && (
            <div className="relative mb-6">
              <label className="text-sm font-medium">
                {programPath === "DOUBLE_MAJOR" ? "복수전공" : "부전공"}
              </label>

              <input
                value={secondaryMajorQuery}
                onChange={(event) => {
                  setSecondaryMajorQuery(event.target.value);
                  setSecondaryMajor(null);
                  setShowSecondaryResults(true);
                }}
                onFocus={() => setShowSecondaryResults(true)}
                placeholder="추가 학과를 입력하세요"
                className="w-full border-b py-2 outline-none"
              />

              {showSecondaryResults && secondaryMajorQuery && (
                <ul className="absolute left-0 top-full z-20 -mt-px max-h-[220px] w-full overflow-y-auto rounded-md border bg-white shadow">
                  {secondaryDepartmentsLoading && (
                    <li className="px-4 py-2 text-sm text-gray-400">
                      학과를 검색하고 있습니다.
                    </li>
                  )}
                  {!secondaryDepartmentsLoading &&
                    secondaryDepartmentsError && (
                      <li className="px-4 py-2 text-sm text-red-500">
                        학과 목록을 불러오지 못했습니다.
                      </li>
                    )}
                  {!secondaryDepartmentsLoading &&
                    !secondaryDepartmentsError &&
                    secondaryDepartments.length === 0 && (
                      <li className="px-4 py-2 text-sm text-gray-400">
                        주전공을 제외한 검색 결과가 없습니다.
                      </li>
                    )}
                  {!secondaryDepartmentsLoading &&
                    !secondaryDepartmentsError &&
                    secondaryDepartments.map((department) => (
                      <li
                        key={department.code}
                        onClick={() => {
                          setSecondaryMajor(department);
                          setSecondaryMajorQuery(department.name);
                          setShowSecondaryResults(false);
                        }}
                        className="cursor-pointer px-4 py-2 hover:bg-purple-50"
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
          )}

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
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
            className={`w-full rounded-full py-3 font-medium ${
              canSubmit && !submitting
                ? "bg-[#6C4FD9] text-white"
                : "bg-[#EAE4FB] text-[#B3A6E8]"
            }`}
          >
            {submitting ? "저장 중..." : "시작하기"}
          </button>

          {submitError && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600"
            >
              {submitError}
            </p>
          )}

        </div>
      </div>
    </main>
  );
}
