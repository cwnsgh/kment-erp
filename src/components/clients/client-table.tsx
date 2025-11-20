const clients = [
  {
    id: 'C-001',
    name: '누리테크',
    businessNumber: '123-45-67890',
    manager: '김지훈',
    phone: '02-1234-5678',
    status: '활성'
  },
  {
    id: 'C-002',
    name: '에이펙스몰',
    businessNumber: '345-67-89012',
    manager: '송하늘',
    phone: '070-9876-1234',
    status: '계약 협상'
  },
  {
    id: 'C-003',
    name: '베타리빙',
    businessNumber: '567-89-01234',
    manager: '신다온',
    phone: '031-456-7890',
    status: '휴면'
  }
];

const statusTone: Record<string, string> = {
  활성: 'bg-emerald-50 text-emerald-600',
  '계약 협상': 'bg-amber-50 text-amber-700',
  휴면: 'bg-slate-100 text-slate-500'
};

export function ClientTable() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">거래처 목록</h2>
          <p className="text-sm text-slate-500">최근 등록된 거래처를 포함한 120개 거래처를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="거래처명 / 사업자번호 검색"
            className="h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            필터
          </button>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">코드</th>
              <th className="px-6 py-3">거래처명</th>
              <th className="px-6 py-3">사업자번호</th>
              <th className="px-6 py-3">담당자</th>
              <th className="px-6 py-3">연락처</th>
              <th className="px-6 py-3">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-500">{client.id}</td>
                <td className="whitespace-nowrap px-6 py-3 font-medium text-slate-900">{client.name}</td>
                <td className="whitespace-nowrap px-6 py-3 text-slate-600">{client.businessNumber}</td>
                <td className="whitespace-nowrap px-6 py-3 text-slate-600">{client.manager}</td>
                <td className="whitespace-nowrap px-6 py-3 text-slate-600">{client.phone}</td>
                <td className="whitespace-nowrap px-6 py-3">
                  <span
                    className={[
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      statusTone[client.status] ?? 'bg-slate-100 text-slate-600'
                    ].join(' ')}
                  >
                    {client.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}











