const statuses = [
  {
    name: '준비 중',
    count: 6,
    amount: '₩124,000,000',
    description: '서명 대기 또는 작업 시작 전 단계',
    items: [
      { id: 'CON-2024-018', title: '에이펙스몰 리뉴얼', owner: '오지훈' },
      { id: 'CON-2024-021', title: '베타리빙 신규 구축', owner: '장민서' }
    ]
  },
  {
    name: '진행 중',
    count: 24,
    amount: '₩398,500,000',
    description: '현재 서비스 또는 구축 작업이 진행 중',
    items: [
      { id: 'CON-2023-102', title: '누리테크 유지보수', owner: '김주영' },
      { id: 'CON-2024-004', title: '씨앤엠 CS 대행', owner: '이도현' }
    ]
  },
  {
    name: '종료 예정',
    count: 4,
    amount: '₩36,800,000',
    description: '30일 이내 종료되는 계약',
    items: [
      { id: 'CON-2023-044', title: '베타리빙 CS 대행', owner: '장민서' }
    ]
  }
];

const tone: Record<string, string> = {
  '준비 중': 'border-blue-100 bg-blue-50 text-blue-700',
  '진행 중': 'border-emerald-100 bg-emerald-50 text-emerald-700',
  '종료 예정': 'border-amber-100 bg-amber-50 text-amber-700'
};

export function ContractStatusBoard() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statuses.map((status) => (
        <section key={status.name} className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">{status.name}</p>
            <p className="mt-1 text-xs text-slate-500">{status.description}</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800">{status.count}건</span>
              <span className="font-medium text-slate-500">{status.amount}</span>
            </div>
          </header>
          <ul className="flex flex-1 flex-col gap-3 px-5 py-4">
            {status.items.map((item) => (
              <li
                key={item.id}
                className={[
                  'rounded-lg border px-4 py-3 text-sm shadow-sm transition hover:shadow-md',
                  tone[status.name] ?? 'border-slate-200 bg-slate-50 text-slate-700'
                ].join(' ')}
              >
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-xs opacity-80">
                  {item.id} · 담당 {item.owner}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}












