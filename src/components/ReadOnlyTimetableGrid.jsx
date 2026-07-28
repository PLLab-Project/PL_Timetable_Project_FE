const DAYS = ["월", "화", "수", "목", "금"];
const TIMES = ["9", "10", "11", "12", "1", "2", "3", "4", "5", "6"];
const COLORS = ["#F0C92D", "#75C6A8", "#F09A86", "#78A7E8", "#B997E8"];

export default function ReadOnlyTimetableGrid({ courses }) {
  const blocks = courses.flatMap((course, courseIndex) => {
    const courseBlocks =
      course.blocks?.length > 0
        ? course.blocks
        : [
            {
              day: course.day,
              start: course.start,
              span: course.span,
              room: course.room,
            },
          ];

    return courseBlocks
      .filter(
        (block) =>
          block.day !== undefined &&
          block.start !== undefined &&
          block.span !== undefined,
      )
      .map((block, blockIndex) => ({
        course,
        courseIndex,
        block,
        key: `${course.id}-${block.day}-${block.start}-${blockIndex}`,
      }));
  });

  return (
    <div className="timetable-grid relative mt-2 aspect-[6/7] w-full overflow-hidden rounded-[15px] border border-[#d9d9d9] bg-white">
      <div className="grid h-full grid-cols-[13px_repeat(5,1fr)] grid-rows-[14px_repeat(10,minmax(0,1fr))]">
        <div className="border-b border-[#dedede]" />
        {DAYS.map((day) => (
          <div key={day} className="border-b border-l border-[#dedede] text-center text-[10px] leading-[13px] text-[#999]">
            {day}
          </div>
        ))}
        {TIMES.map((time, row) => (
          <div key={time} className="contents">
            <div className={`${row === 0 ? "" : "border-t"} border-[#ededed] pr-0.5 pt-1 text-right text-[9px] text-[#999]`}>
              {time}
            </div>
            {DAYS.map((day) => (
              <div
                key={`${time}-${day}`}
                className={`border-l ${row === 0 ? "" : "border-t"} border-[#ededed]`}
              />
            ))}
          </div>
        ))}
      </div>
      {blocks.map(({ course, courseIndex, block, key }) => (
        <div
          key={key}
          className="absolute overflow-hidden p-[2px] text-[8px] font-medium leading-[1.15] text-white shadow-[inset_0_0_0_0.5px_#fff]"
          style={{
            background: course.color || COLORS[courseIndex % COLORS.length],
            left: `calc(13px + ${block.day} * ((100% - 13px) / 5))`,
            top: `calc(14px + ${block.start * 10}% - ${block.start * 1.4}px)`,
            width: "calc((100% - 13px) / 5)",
            height: `calc(${block.span * 10}% - ${block.span * 1.4}px)`,
          }}
        >
          <p className="line-clamp-2 text-[9px] font-bold leading-[1.15]">{course.name}</p>
          <p className="mt-[3px]">{course.professor}</p>
          <p className="mt-[2px] break-all text-[8px] leading-[1.15]">
            {block.room || course.room}
          </p>
        </div>
      ))}
    </div>
  );
}
