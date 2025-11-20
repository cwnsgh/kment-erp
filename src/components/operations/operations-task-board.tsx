const operations = [
  {
    id: 'OP-2024-09',
    title: '에이펙스몰 이벤트 배너 교체',
    client: '에이펙스몰',
    requestStatus: '승인',
    progress: '진행 중',
    owner: '오지훈',
    updatedAt: '2024-05-12 14:10'
  },
  {
    id: 'OP-2024-12',
    title: '누리테크 서버 점검',
    client: '누리테크',
    requestStatus: '요청',
    progress: '대기',
    owner: '김주영',
    updatedAt: '2024-05-11 09:22'
  },
  {
    id: 'OP-2024-15',
    title: '베타리빙 VOC 공유',
    client: '베타리빙',
    requestStatus: '반려',
    progress: '중단',
    owner: '장민서',
    updatedAt: '2024-05-10 17:05'
  }
];

const requestTone: Record<string, string> = {
  승인: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  요청: 'bg-blue-50 text-blue-600 border-blue-100',
  반려: 'bg-rose-50 text-rose-600 border-rose-100'
};

const progressTone: Record<string, string> = {
  '진행 중': 'bg-primary text-primary-foreground',
  대기: 'bg-slate-100 text-slate-600',
  중단: 'bg-slate-200 text-slate-500'
};

export function OperationsTaskBoard() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">관리업무 승인 현황</h2>
          <p className="text-sm text-slate-500">고객 요청 및 승인 결과를 기반으로 업무를 진행합니다.</p>
        </div>
        <div className="flex gap-2">
          <select className="h-9 rounded-md border border-slate-200 px-3 text-sm text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option>요청 상태</option>
            <option>승인</option>
            <option>요청</option>
            <option>반려</option>
          </select>
          <select className="h-9 rounded-md border border-slate-200 px-3 text-sm text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option>진행 상태</option>
            <option>진행 중</option>
            <option>대기</option>
            <option>중단</option>
          </select>
        </div>
      </header>
      <div className="space-y-3">
        {operations.map((operation) => (
          <article key={operation.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{operation.title}</p>
                <p className="text-xs text-slate-500">
                  {operation.client} · {operation.id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    requestTone[operation.requestStatus] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                  ].join(' ')}
                >
                  요청 {operation.requestStatus}
                </span>
                <span
                  className={[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    progressTone[operation.progress] ?? 'bg-slate-100 text-slate-600'
                  ].join(' ')}
                >
                  {operation.progress}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>담당자: {operation.owner}</span>
              <span>최근 업데이트: {operation.updatedAt}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}











