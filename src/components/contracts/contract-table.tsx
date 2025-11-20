const contracts = [
  {
    id: "CON-2024-001",
    title: "누리테크 유지보수",
    client: "누리테크",
    manager: "김주영",
    amount: "₩18,000,000",
    period: "2024.03.01 ~ 2025.02.28",
    status: "진행 중",
  },
  {
    id: "CON-2024-012",
    title: "에이펙스몰 플랫폼 전환",
    client: "에이펙스몰",
    manager: "오지훈",
    amount: "₩32,500,000",
    period: "2024.04.05 ~ 2024.12.31",
    status: "준비 중",
  },
  {
    id: "CON-2023-044",
    title: "베타리빙 CS 대행",
    client: "베타리빙",
    manager: "장민서",
    amount: "₩9,800,000",
    period: "2023.07.01 ~ 2024.06.30",
    status: "종료 예정",
  },
];

const statusTone: Record<string, string> = {
  "진행 중": "bg-emerald-50 text-emerald-600",
  "준비 중": "bg-blue-50 text-blue-600",
  "종료 예정": "bg-amber-50 text-amber-600",
};

export function ContractTable() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">계약 목록</h2>
          <p className="text-sm text-slate-500">
            최근 6개월 내 체결 계약과 갱신 예정 계약을 확인하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <select className="h-9 rounded-md border border-slate-200 px-3 text-sm text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option>전체 상태</option>
            <option>진행 중</option>
            <option>준비 중</option>
            <option>종료 예정</option>
          </select>
          <input
            type="search"
            placeholder="계약명 / 거래처 검색"
            className="h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">계약번호</th>
              <th className="px-6 py-3">계약명</th>
              <th className="px-6 py-3">거래처</th>
              <th className="px-6 py-3">담당자</th>
              <th className="px-6 py-3">계약기간</th>
              <th className="px-6 py-3">금액</th>
              <th className="px-6 py-3">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {contracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-500">
                  {contract.id}
                </td>
                <td className="whitespace-nowrap px-6 py-3 font-medium text-slate-900">
                  {contract.title}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-slate-600">
                  {contract.client}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-slate-600">
                  {contract.manager}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-slate-600">
                  {contract.period}
                </td>
                <td className="whitespace-nowrap px-6 py-3 font-semibold text-slate-800">
                  {contract.amount}
                </td>
                <td className="whitespace-nowrap px-6 py-3">
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusTone[contract.status] ??
                        "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {contract.status}
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






