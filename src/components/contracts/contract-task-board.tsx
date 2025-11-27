const tasks = [
  {
    id: 'TASK-2405-01',
    contract: '에이펙스몰 플랫폼 전환',
    client: '에이펙스몰',
    progress: 65,
    status: '승인 대기',
    owner: '오지훈',
    updatedAt: '2024-05-12 10:30'
  },
  {
    id: 'TASK-2405-07',
    contract: '누리테크 유지보수',
    client: '누리테크',
    progress: 82,
    status: '진행 중',
    owner: '김주영',
    updatedAt: '2024-05-11 15:42'
  },
  {
    id: 'TASK-2405-13',
    contract: '베타리빙 CS 대행',
    client: '베타리빙',
    progress: 30,
    status: '요청 등록',
    owner: '장민서',
    updatedAt: '2024-05-10 09:18'
  }
];

const statusTone: Record<string, string> = {
  '승인 대기': 'bg-amber-50 text-amber-600 border-amber-100',
  '진행 중': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  '요청 등록': 'bg-blue-50 text-blue-600 border-blue-100'
};

export function ContractTaskBoard() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">계약별 업무 현황</h2>
          <p className="text-sm text-slate-500">요청·승인 프로세스를 포함한 업무 진행도를 확인하세요.</p>
        </div>
        <div className="flex gap-2">
          <select className="h-9 rounded-md border border-slate-200 px-3 text-sm text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option>전체 상태</option>
            <option>승인 대기</option>
            <option>진행 중</option>
            <option>요청 등록</option>
          </select>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            엑셀 다운로드
          </button>
        </div>
      </header>
      <div className="space-y-3">
        {tasks.map((task) => (
          <article key={task.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{task.contract}</p>
                <p className="text-xs text-slate-500">
                  {task.client} · {task.id}
                </p>
              </div>
              <span
                className={[
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  statusTone[task.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                ].join(' ')}
              >
                {task.status}
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>진행률</span>
                <span>{task.progress}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${task.progress}%` }}
                  aria-label={`${task.progress}%`}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>담당자: {task.owner}</span>
              <span>최근 업데이트: {task.updatedAt}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}












