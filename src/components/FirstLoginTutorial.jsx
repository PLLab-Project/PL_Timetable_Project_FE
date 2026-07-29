import { useEffect, useState } from "react";
import {
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LockKeyhole,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const TUTORIAL_STEPS = [
  {
    eyebrow: "일반 시간표 편성",
    title: "원하는 강의를 직접 담아요",
    description:
      "강의를 검색하고 카드를 선택한 뒤 ‘시간표에 추가’를 누르면 원하는 시간표를 직접 만들 수 있어요.",
    icon: Search,
    visual: "manual",
  },
  {
    eyebrow: "자동 시간표 편성",
    title: "조건만 고르면 자동으로 편성해요",
    description:
      "공강 요일, 선호 시간대, 학점과 교양 조건을 선택하면 조건에 맞는 시간표 후보를 만들어줘요.",
    icon: WandSparkles,
    visual: "automatic",
  },
  {
    eyebrow: "시간대 · 강의 고정",
    title: "빈 시간과 강의를 각각 고정해요",
    description:
      "비워둘 시간은 드래그해 선택한 뒤 길게 누르고, 반드시 들을 강의는 시간표의 강의 카드를 길게 누르세요. 빗금이 나타나면 고정 완료이며, 다시 길게 누르면 해제돼요.",
    icon: LockKeyhole,
    visual: "lock",
  },
  {
    eyebrow: "내 강의 활용",
    title: "들은 강의는 다시 추천하지 않아요",
    description:
      "‘내 강의’에 이수 과목을 입력해두면 자동편성에서 제외하고, 남은 졸업요건을 고려해 강의를 편성해요.",
    icon: BookOpenCheck,
    visual: "completed",
  },
  {
    eyebrow: "졸업요건 확인",
    title: "졸업까지 남은 항목을 확인해요",
    description:
      "내 강의의 ‘졸업요건 확인’에서 이수 학점과 남은 필수 과목을 한눈에 확인할 수 있어요.",
    icon: GraduationCap,
    visual: "graduation",
  },
];

function TutorialIllustration({ type }) {
  if (type === "manual") {
    return (
      <div className="tutorial-visual h-[252px] rounded-[24px] bg-[#f7f5ff] p-5">
        <div className="flex h-10 items-center gap-2 rounded-full border border-[#e6e2ee] bg-white px-4 text-[11px] text-[#999] shadow-sm">
          <Search size={14} />
          과목명, 교수명으로 검색
        </div>
        <div className="mt-4 rounded-[16px] bg-white p-4 shadow-[0_8px_24px_rgba(50,32,95,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-bold">프론트엔드 웹디자인</p>
              <p className="mt-1 text-[11px] font-medium text-[#555]">김정민</p>
            </div>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-[10px] font-bold text-brand">
              + 시간표에 추가
            </span>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-[#aaa]">
            수 09:30-11:30, 목 09:30-11:00
            <br />
            강의 A409-웹스트리밍실습실
          </p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-brand">
          <Check size={15} className="rounded-full bg-brand text-white" />
          선택한 강의가 시간표에 바로 표시돼요
        </div>
      </div>
    );
  }

  if (type === "automatic") {
    return (
      <div className="tutorial-visual h-[276px] rounded-[24px] bg-[#f7f5ff] p-4">
        <div className="h-full rounded-[18px] bg-white px-3.5 py-3 shadow-[0_8px_24px_rgba(50,32,95,0.06)]">
          <div className="flex items-center justify-between border-b border-[#ededed] pb-2">
            <span className="text-[11px] font-bold">조건 설정</span>
            <span className="text-[13px] font-light leading-none text-[#999]">×</span>
          </div>

          <div className="mt-2 space-y-2">
            <div>
              <p className="mb-1 text-[8px] font-medium text-[#333]">공강 희망 요일</p>
              <div className="grid grid-cols-5 gap-1">
                {["월", "화", "수", "목", "금"].map((day) => (
                  <span
                    key={day}
                    className={`flex h-[18px] items-center justify-center rounded-full border text-[7px] ${
                      day === "금"
                        ? "border-brand font-semibold text-[#222] ring-1 ring-brand"
                        : "border-[#e5e5e5] text-[#555]"
                    }`}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[8px] font-medium text-[#333]">선호 시간대</p>
              <div className="grid grid-cols-3 gap-1">
                {["오전", "오후", "저녁"].map((time) => (
                  <span
                    key={time}
                    className={`flex h-[18px] items-center justify-center rounded-full border text-[7px] ${
                      time === "오전"
                        ? "border-brand font-semibold text-[#222] ring-1 ring-brand"
                        : "border-[#e5e5e5] text-[#555]"
                    }`}
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[8px] font-medium text-[#333]">학점 설정</p>
              <div className="px-1">
                <div className="relative h-3">
                  <span className="absolute inset-x-0 top-1 h-1 rounded-full bg-[#ececef]" />
                  <span className="absolute inset-x-0 top-1 h-1 rounded-full bg-brand" />
                  <span className="absolute left-0 top-0 h-3 w-3 rounded-full border border-brand bg-white" />
                  <span className="absolute right-0 top-0 h-3 w-3 rounded-full border border-brand bg-white" />
                </div>
                <div className="flex justify-between text-[7px] text-[#666]">
                  <span>12</span>
                  <span>22</span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-1 text-[8px] font-medium text-[#333]">교양 선택</p>
              <div className="grid grid-cols-3 gap-1">
                {["인간과 소통", "사회와 경제", "과학과 기술"].map((liberal, index) => (
                  <span
                    key={liberal}
                    className={`flex h-[18px] items-center justify-center rounded-full border text-[6px] ${
                      index === 0
                        ? "border-brand font-semibold text-[#222] ring-1 ring-brand"
                        : "border-[#e5e5e5] text-[#555]"
                    }`}
                  >
                    {liberal}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[8px] font-medium text-[#333]">전공과목 학년 선택</p>
              <div className="flex gap-2 text-[7px] text-[#555]">
                {[1, 2, 3, 4].map((grade) => (
                  <span key={grade} className="flex items-center gap-0.5">
                    <i
                      className={`h-2 w-2 rounded-full border ${
                        grade === 2 ? "border-brand bg-brand" : "border-[#ddd]"
                      }`}
                    />
                    {grade}학년
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (type === "lock") {
    return (
      <div className="tutorial-visual h-[276px] rounded-[24px] bg-[#f7f5ff] p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="overflow-hidden rounded-[14px] border border-[#e6e1f2] bg-white">
            <div
              className="flex h-[70px] items-center justify-center bg-[#eee9ff]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, transparent 0 7px, rgba(112,71,235,.42) 7px 8.5px)",
              }}
            >
              <LockKeyhole size={18} className="text-brand" />
            </div>
            <div className="px-2.5 py-2">
              <p className="text-[10px] font-bold text-brand">빈 시간 고정</p>
              <p className="mt-1 break-keep text-[8px] leading-3.5 text-[#777]">
                자동편성 시 이 시간은 반드시 비워둬요
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-[#e6e1f2] bg-white">
            <div
              className="flex h-[70px] items-center justify-center bg-[#f0c92d]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, transparent 0 7px, rgba(255,255,255,.7) 7px 8.5px)",
              }}
            >
              <LockKeyhole size={18} className="text-white" />
            </div>
            <div className="px-2.5 py-2">
              <p className="text-[10px] font-bold text-[#9d7900]">강의 고정</p>
              <p className="mt-1 break-keep text-[8px] leading-3.5 text-[#777]">
                자동편성 결과에 이 강의를 반드시 포함해요
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2 rounded-[14px] bg-white px-3 py-2.5">
          <div className="flex items-center gap-2 text-[8px] text-[#666]">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand text-[7px] font-bold text-white">
              1
            </span>
            <span><b className="text-[#333]">빈 시간:</b> 시간대를 드래그해 선택 → 길게 누르기</span>
          </div>
          <div className="flex items-center gap-2 text-[8px] text-[#666]">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand text-[7px] font-bold text-white">
              2
            </span>
            <span><b className="text-[#333]">강의:</b> 시간표에 추가된 강의 카드 → 길게 누르기</span>
          </div>
          <p className="border-t border-[#eee] pt-2 text-center text-[8px] font-semibold text-brand">
            빗금이 생기면 고정 완료 · 다시 길게 누르면 해제
          </p>
        </div>
      </div>
    );
  }

  if (type === "completed") {
    return (
      <div className="tutorial-visual h-[252px] rounded-[24px] bg-[#f7f5ff] p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[12px] font-bold">
            <BookOpenCheck size={16} className="text-brand" /> 내 강의
          </span>
          <span className="text-[9px] font-semibold text-[#999]">이수 과목 12개</span>
        </div>
        <div className="space-y-2">
          {["운영체제론", "게임프로그래밍", "컴퓨터알고리즘"].map((course) => (
            <div
              key={course}
              className="flex items-center justify-between rounded-[12px] border border-[#ebe8f0] bg-white px-3 py-2.5"
            >
              <span className="text-[10px] font-semibold">{course}</span>
              <Check size={14} className="text-brand" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 rounded-[12px] bg-brand px-3 py-2 text-[10px] font-semibold text-white">
          <Sparkles size={14} />
          이수 과목 제외 · 졸업요건 반영
        </div>
      </div>
    );
  }

  return (
    <div className="tutorial-visual h-[252px] rounded-[24px] bg-[#f7f5ff] p-5">
      <div className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(50,32,95,0.08)]">
        <div className="flex items-center justify-between text-[12px] font-bold">
          <span>전체</span>
          <span>91 / 126 학점</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ececec]">
          <span className="block h-full w-[72%] rounded-full bg-brand" />
        </div>
        <div className="mt-5 space-y-4">
          {[
            ["전공", "42 / 63", "67%"],
            ["교양", "33 / 46", "72%"],
          ].map(([label, credits, width]) => (
            <div key={label}>
              <div className="mb-1.5 flex justify-between text-[10px]">
                <span className="font-semibold">{label}</span>
                <span className="text-[#777]">{credits} 학점</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#ececec]">
                <span
                  className="block h-full rounded-full bg-[#8b6af0]"
                  style={{ width }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-white px-3 py-2.5 text-[10px] text-[#777]">
        <GraduationCap size={15} className="shrink-0 text-brand" />
        남은 필수 과목까지 함께 확인할 수 있어요
      </div>
    </div>
  );
}

export default function FirstLoginTutorial({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = TUTORIAL_STEPS[stepIndex];
  const StepIcon = step.icon;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft" && !isFirstStep) {
        setStepIndex((current) => current - 1);
      }
      if (event.key === "ArrowRight" && !isLastStep) {
        setStepIndex((current) => current + 1);
      }
      if (event.key === "Escape") onComplete();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFirstStep, isLastStep, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f7f5ff] lg:bg-black/30 lg:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        className="flex h-full w-full flex-col overflow-hidden bg-white lg:h-[min(780px,calc(100dvh-48px))] lg:max-w-[520px] lg:rounded-[28px] lg:shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between px-6 pb-3 pt-6 sm:px-8">
          <span className="text-[12px] font-semibold text-[#999]">
            {stepIndex + 1} / {TUTORIAL_STEPS.length}
          </span>
          <button
            type="button"
            onClick={onComplete}
            className="rounded-full px-3 py-2 text-[12px] font-semibold text-[#888] transition hover:bg-[#f5f5f5] hover:text-[#555]"
          >
            건너뛰기
          </button>
        </header>

        <div className="h-1 shrink-0 bg-[#f1eef8]">
          <span
            className="block h-full rounded-r-full bg-brand transition-[width] duration-300"
            style={{
              width: `${((stepIndex + 1) / TUTORIAL_STEPS.length) * 100}%`,
            }}
          />
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-7">
          <div key={stepIndex} className="animate-tutorial-step">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-brand-soft text-brand">
                <StepIcon size={18} />
              </span>
              <span className="text-[11px] font-bold text-brand">{step.eyebrow}</span>
            </div>

            <TutorialIllustration type={step.visual} />

            <div className="mt-6 text-center">
              <h1
                id="tutorial-title"
                className="break-keep text-[21px] font-extrabold tracking-[-0.02em] text-[#171717] sm:text-[23px]"
              >
                {step.title}
              </h1>
              <p className="mx-auto mt-3 max-w-[410px] break-keep text-[13px] leading-6 text-[#777]">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        <footer className="shrink-0 bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 sm:px-8">
          <div className="mb-4 flex justify-center gap-1.5">
            {TUTORIAL_STEPS.map((item, index) => (
              <button
                type="button"
                key={item.eyebrow}
                onClick={() => setStepIndex(index)}
                aria-label={`${index + 1}단계로 이동`}
                className={`h-1.5 rounded-full transition-all ${
                  index === stepIndex ? "w-6 bg-brand" : "w-1.5 bg-[#ddd]"
                }`}
              />
            ))}
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <button
              type="button"
              disabled={isFirstStep}
              onClick={() => setStepIndex((current) => current - 1)}
              className="flex h-12 items-center justify-center gap-1 rounded-[14px] border border-[#e5e5e5] text-[13px] font-semibold text-[#666] transition hover:bg-[#fafafa] disabled:cursor-default disabled:opacity-0"
            >
              <ChevronLeft size={17} /> 이전
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  onComplete();
                  return;
                }
                setStepIndex((current) => current + 1);
              }}
              className="flex h-12 items-center justify-center gap-1 rounded-[14px] bg-brand text-[14px] font-bold text-white transition hover:bg-[#633bdc] active:scale-[0.99]"
            >
              {isLastStep ? "시간표 시작하기" : "다음"}
              {!isLastStep && <ChevronRight size={17} />}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
