import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import { getDepartments } from "../api/departments";

const PROGRAM_PATH_OPTIONS = [
  { value: "ADVANCED_MAJOR", label: "단일전공" },
  { value: "DOUBLE_MAJOR", label: "복수전공" },
  { value: "MINOR", label: "부전공" },
];

export default function MyAccountInfo({
  user,
  onSave,
  onBack,
  onCourses,
  onTimetable,
  onMyPage,
}) {
  const initialProgramPath = ["DOUBLE_MAJOR", "MINOR"].includes(
    user.programPath,
  )
    ? user.programPath
    : "ADVANCED_MAJOR";
  const [majorQuery, setMajorQuery] = useState(user.major ?? "");
  const [department, setDepartment] = useState(
    user.departmentCode
      ? {
          code: user.departmentCode,
          name: user.major,
          collegeName: user.collegeName,
        }
      : null,
  );
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [showDepartments, setShowDepartments] = useState(false);
  const [programPath, setProgramPath] = useState(initialProgramPath);
  const [secondaryMajorQuery, setSecondaryMajorQuery] = useState(
    user.secondaryMajor ?? "",
  );
  const [secondaryDepartment, setSecondaryDepartment] = useState(
    user.secondaryDepartmentCode
      ? {
          code: user.secondaryDepartmentCode,
          name: user.secondaryMajor,
          collegeName: user.secondaryCollegeName,
        }
      : null,
  );
  const [secondaryDepartments, setSecondaryDepartments] = useState([]);
  const [secondaryDepartmentsLoading, setSecondaryDepartmentsLoading] =
    useState(false);
  const [showSecondaryDepartments, setShowSecondaryDepartments] =
    useState(false);
  const [grade, setGrade] = useState(`${user.grade}학년`);
  const [name, setName] = useState(user.name ?? "");
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const needsSecondaryMajor = programPath !== "ADVANCED_MAJOR";

  useEffect(() => {
    const query = majorQuery.trim();

    if (!showDepartments || !query || department?.name === query) {
      setDepartments([]);
      setDepartmentsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setDepartmentsLoading(true);
      getDepartments(
        { query, currentOnly: true, page: 0, size: 20 },
        controller.signal,
      )
        .then((result) => setDepartments(result?.items ?? []))
        .catch((error) => {
          if (error.name !== "AbortError") setDepartments([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setDepartmentsLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [department, majorQuery, showDepartments]);

  useEffect(() => {
    const query = secondaryMajorQuery.trim();

    if (
      !needsSecondaryMajor ||
      !showSecondaryDepartments ||
      !query ||
      secondaryDepartment?.name === query
    ) {
      setSecondaryDepartments([]);
      setSecondaryDepartmentsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSecondaryDepartmentsLoading(true);
      getDepartments(
        { query, currentOnly: true, page: 0, size: 20 },
        controller.signal,
      )
        .then((result) => {
          setSecondaryDepartments(
            (result?.items ?? []).filter(
              (item) => item.code !== department?.code,
            ),
          );
        })
        .catch((error) => {
          if (error.name !== "AbortError") setSecondaryDepartments([]);
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
  }, [
    department?.code,
    needsSecondaryMajor,
    secondaryDepartment,
    secondaryMajorQuery,
    showSecondaryDepartments,
  ]);

  const handleSave = async () => {
    if (
      !department?.code ||
      !name.trim() ||
      (needsSecondaryMajor && !secondaryDepartment?.code)
    ) {
      setSaveError(
        needsSecondaryMajor
          ? "이름과 주전공, 추가 전공을 확인해주세요."
          : "이름과 학과를 확인해주세요.",
      );
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      await onSave({
        name: name.trim(),
        studentId: user.studentId,
        major: department.name,
        departmentCode: department.code,
        collegeName: department.collegeName,
        programPath,
        secondaryMajor: secondaryDepartment?.name ?? "",
        secondaryDepartmentCode: secondaryDepartment?.code ?? "",
        secondaryCollegeName: secondaryDepartment?.collegeName ?? "",
        grade: parseInt(grade, 10) || user.grade,

        academicPrograms: [
          {
            academicUnitCode: department.code,
            role: "PRIMARY",
          },
          ...(secondaryDepartment?.code
            ? [
                {
                  academicUnitCode: secondaryDepartment.code,
                  role: 
                    programPath === "DOUBLE_MAJOR"
                      ? "DOUBLE_MAJOR"
                      : "MINOR",
                },
              ]
            : []),
        ],
      });
      setShowSavedModal(true);
    } catch (error) {
      setSaveError(error.message || "계정 정보를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="my-courses-page relative h-full overflow-hidden">
        <div className="my-courses-content no-scrollbar h-full overflow-y-auto px-[14px] pb-[80px] pt-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} aria-label="뒤로가기">
              <ArrowLeft size={16} className="text-black" />
            </button>
            <h1 className="text-xl font-bold">계정정보 확인/변경</h1>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EEEAFE]">
              <span className="text-2xl text-[#6C4FD9]">
                {name.charAt(0)}
              </span>
            </div>
            <p className="mt-3 text-lg font-bold">{name}</p>
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-gray-500">
                복수전공·부전공 여부
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PROGRAM_PATH_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    aria-pressed={programPath === option.value}
                    onClick={() => {
                      setProgramPath(option.value);
                      if (option.value === "ADVANCED_MAJOR") {
                        setSecondaryDepartment(null);
                        setSecondaryMajorQuery("");
                        setShowSecondaryDepartments(false);
                      }
                    }}
                    className={`rounded-full border py-2.5 text-sm transition-colors ${
                      programPath === option.value
                        ? "border-[#6C4FD9] text-[#6C4FD9]"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-500">
                {needsSecondaryMajor ? "주전공" : "학과"}
              </label>
              <div className="relative">
                <input
                  value={majorQuery}
                  onChange={(event) => {
                    setMajorQuery(event.target.value);
                    setDepartment(null);
                    setShowDepartments(true);
                  }}
                  onFocus={() => setShowDepartments(true)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6C4FD9]"
                />
                {showDepartments && majorQuery.trim() && !department && (
                  <div className="absolute left-0 right-0 top-full z-20 -mt-px max-h-48 overflow-y-auto rounded-b-lg border border-gray-200 bg-white shadow-sm">
                    {departmentsLoading && (
                      <p className="px-4 py-3 text-xs text-gray-400">
                        학과를 검색하고 있습니다.
                      </p>
                    )}
                    {!departmentsLoading && departments.length === 0 && (
                      <p className="px-4 py-3 text-xs text-gray-400">
                        검색 결과가 없습니다.
                      </p>
                    )}
                    {!departmentsLoading &&
                      departments.map((item) => (
                        <button
                          type="button"
                          key={item.code}
                          onClick={() => {
                            setDepartment(item);
                            setMajorQuery(item.name);
                            setShowDepartments(false);
                            if (secondaryDepartment?.code === item.code) {
                              setSecondaryDepartment(null);
                              setSecondaryMajorQuery("");
                            }
                          }}
                          className="block w-full border-t border-gray-100 px-4 py-2 text-left first:border-t-0 hover:bg-purple-50"
                        >
                          <span className="block text-sm text-gray-800">
                            {item.name}
                          </span>
                          {item.collegeName && (
                            <span className="text-[11px] text-gray-400">
                              {item.collegeName}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {needsSecondaryMajor && (
              <div>
                <label className="mb-1 block text-sm text-gray-500">
                  {programPath === "DOUBLE_MAJOR" ? "복수전공" : "부전공"}
                </label>
                <div className="relative">
                  <input
                    value={secondaryMajorQuery}
                    onChange={(event) => {
                      setSecondaryMajorQuery(event.target.value);
                      setSecondaryDepartment(null);
                      setShowSecondaryDepartments(true);
                    }}
                    onFocus={() => setShowSecondaryDepartments(true)}
                    placeholder="추가 학과를 입력하세요"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6C4FD9]"
                  />
                  {showSecondaryDepartments &&
                    secondaryMajorQuery.trim() &&
                    !secondaryDepartment && (
                      <div className="absolute left-0 right-0 top-full z-20 -mt-px max-h-48 overflow-y-auto rounded-b-lg border border-gray-200 bg-white shadow-sm">
                        {secondaryDepartmentsLoading && (
                          <p className="px-4 py-3 text-xs text-gray-400">
                            학과를 검색하고 있습니다.
                          </p>
                        )}
                        {!secondaryDepartmentsLoading &&
                          secondaryDepartments.length === 0 && (
                            <p className="px-4 py-3 text-xs text-gray-400">
                              주전공을 제외한 검색 결과가 없습니다.
                            </p>
                          )}
                        {!secondaryDepartmentsLoading &&
                          secondaryDepartments.map((item) => (
                            <button
                              type="button"
                              key={item.code}
                              onClick={() => {
                                setSecondaryDepartment(item);
                                setSecondaryMajorQuery(item.name);
                                setShowSecondaryDepartments(false);
                              }}
                              className="block w-full border-t border-gray-100 px-4 py-2 text-left first:border-t-0 hover:bg-purple-50"
                            >
                              <span className="block text-sm text-gray-800">
                                {item.name}
                              </span>
                              {item.collegeName && (
                                <span className="text-[11px] text-gray-400">
                                  {item.collegeName}
                                </span>
                              )}
                            </button>
                          ))}
                      </div>
                    )}
                </div>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm text-gray-500">학번</label>
              <input
                value={user.studentId ?? ""}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 outline-none"
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

          {saveError && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {saveError}
            </p>
          )}

          <div className="mt-8 flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-500"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-[#6C4FD9] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "저장 중" : "저장"}
            </button>
          </div>
        </div>

        {showSavedModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35">
            <section className="w-[290px] rounded-2xl bg-white px-6 py-8 text-center shadow-lg">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3DE]">
                <span className="text-xl text-[#3B6D11]">✓</span>
              </div>
              <p className="mt-4 text-base font-semibold">저장되었습니다</p>
              <p className="mt-1 text-xs text-gray-400">
                계정 정보가 변경되었어요
              </p>
              <button
                onClick={() => {
                  setShowSavedModal(false);
                  onBack();
                }}
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
