import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";

const quickActions = [
  { label: "거래처 등록", href: "/clients/new" },
  { label: "계약 등록", href: "/contracts/new" },
  { label: "일정 등록", href: "/schedule" },
  { label: "관리고객 등록", href: "/operations/clients" },
  { label: "업무 등록 (관리고객)", href: "/operations/new" },
  { label: "업무 등록 (계약고객)", href: "/operations/tasks" },
  { label: "직원 등록", href: "/staff" },
  { label: "월차 신청", href: "/vacations" },
  { label: "월차 신청 조회", href: "/vacations" },
];

const summary = [
  {
    title: "연차 신청 현황",
    total: "3건",
    period: "2025.10",
    items: [
      { label: "승인", value: 3 },
      { label: "대기", value: 1 },
      { label: "반려", value: 0 },
    ],
  },
  {
    title: "이번달 계약 현황",
    total: "4건",
    period: "2025.10",
    items: [
      { label: "신규 거래처 등록", value: 3 },
      { label: "계약 고객 등록", value: 1 },
      { label: "관리 고객 등록", value: 0 },
      { label: "미납 거래처", value: 3 },
      { label: "분납 거래처", value: 1 },
      { label: "총 매출", value: "10,000,000원" },
    ],
  },
  {
    title: "CS 업무 현황",
    total: "12건",
    period: "2025.10",
    items: [
      { label: "진행 중", value: 5 },
      { label: "대기 중", value: 4 },
      { label: "완료", value: 3 },
      { label: "관리고객 업무", value: 8 },
      { label: "계약고객 업무", value: 4 },
    ],
  },
];

// 일정 데이터 예시
const scheduleData = [
  {
    date: 30,
    day: "Wed",
    events: ["오성정밀화학 오픈", "TBK 시안 완료"],
  },
  {
    date: 31,
    day: "Thu",
    events: [],
  },
];

export function DashboardOverview() {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}.${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  return (
    <section className="space-y-8">
      {/* 환영 메시지 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          케이먼트님, 안녕하세요!
        </h1>
      </div>

      {/* 일정 섹션 */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white">
            {currentMonth}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4">
            {scheduleData.map((schedule, idx) => (
              <div
                key={idx}
                className={`flex flex-col rounded-lg p-4 ${
                  idx === 0
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
                style={{ minWidth: "160px" }}
              >
                <div className="text-sm font-semibold">
                  {schedule.day} {schedule.date}
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  {schedule.events.length > 0 ? (
                    schedule.events.map((event, eventIdx) => (
                      <div key={eventIdx} className="flex items-start gap-1.5">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        <span>{event}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500">일정이 없습니다.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50">
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50">
              <ArrowRight size={18} className="text-slate-600" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white hover:bg-accent/90">
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 빠른 액세스 카드들 - 3x3 그리드 */}
      <div className="grid grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group relative flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-accent hover:shadow-md"
          >
            <span className="text-sm font-medium text-slate-700">
              {action.label}
            </span>
            <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white transition group-hover:bg-accent/90">
              <ArrowUpRight size={14} />
            </span>
          </Link>
        ))}
      </div>

      {/* 요약 위젯들 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {summary.map((section) => (
          <div
            key={section.title}
            className="relative rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <button className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white hover:bg-accent/90">
              <ArrowUpRight size={12} />
            </button>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                {section.title} {section.period}
              </h3>
            </div>
            <div className="mb-4 text-4xl font-bold text-accent">
              {section.total}
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600">
              {section.items.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-900">
                    {typeof item.value === "number"
                      ? `${item.value}`
                      : item.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
