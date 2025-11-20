const activities = [
  {
    id: '1',
    title: '누리테크 유지보수 계약 승인',
    actor: '김주영',
    role: '주임',
    timestamp: '오늘 14:32',
    status: '승인'
  },
  {
    id: '2',
    title: '에이펙스몰 신규 관리업무 요청',
    actor: '오지훈',
    role: '대리',
    timestamp: '오늘 10:18',
    status: '요청'
  },
  {
    id: '3',
    title: '베타리빙 거래처 정보 수정',
    actor: '장민서',
    role: '과장',
    timestamp: '어제 19:04',
    status: '변경'
  }
];

const statusTone: Record<string, string> = {
  승인: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  요청: 'bg-blue-50 text-blue-600 border-blue-100',
  변경: 'bg-amber-50 text-amber-600 border-amber-100'
};

export function RecentActivity() {
  return (
    <section className="glass-card shadow-card">
      <header className="flex items-center justify-between border-b border-white/60 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">최근 활동</h2>
        <button
          type="button"
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-muted"
        >
          전체 보기
        </button>
      </header>
      <ul className="divide-y divide-slate-200/60">
        {activities.map((activity) => (
          <li key={activity.id} className="flex items-start gap-4 px-6 py-4 transition hover:bg-white/70">
            <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-slate-600">
              {activity.actor.slice(0, 1)}
            </span>
            <div className="flex-1 space-y-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                {activity.title}
                <span
                  className={[
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                    statusTone[activity.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                  ].join(' ')}
                >
                  {activity.status}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                {activity.actor} · {activity.role}
              </p>
            </div>
            <time className="text-xs text-slate-400">{activity.timestamp}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}


