const managedClients = [
  {
    id: 'MG-2024-01',
    name: '누리테크',
    type: '정기점검',
    owner: '김주영',
    nextSchedule: '2024-05-20',
    note: '월 1회 로그 점검'
  },
  {
    id: 'MG-2024-04',
    name: '에이펙스몰',
    type: '프로모션 지원',
    owner: '오지훈',
    nextSchedule: '2024-05-18',
    note: '5월 이벤트 배너 교체'
  },
  {
    id: 'MG-2024-05',
    name: '베타리빙',
    type: '이슈 대응',
    owner: '장민서',
    nextSchedule: '2024-05-14',
    note: 'CS 자동화 검토'
  }
];

export function ManagedClientTable() {
  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">관리고객 목록</h2>
          <p className="text-xs text-slate-500">현재 18개 고객을 운영 관리 중입니다.</p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        >
          전체 보기
        </button>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">코드</th>
              <th className="px-5 py-3">거래처</th>
              <th className="px-5 py-3">관리 유형</th>
              <th className="px-5 py-3">담당자</th>
              <th className="px-5 py-3">다음 일정</th>
              <th className="px-5 py-3">메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {managedClients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{client.id}</td>
                <td className="px-5 py-3 font-medium text-slate-700">{client.name}</td>
                <td className="px-5 py-3 text-slate-600">{client.type}</td>
                <td className="px-5 py-3 text-slate-600">{client.owner}</td>
                <td className="px-5 py-3 text-slate-600">{client.nextSchedule}</td>
                <td className="px-5 py-3 text-slate-500">{client.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}











