type ComingSoonProps = {
  feature: string;
  hidden?: boolean;
};

export function ComingSoon({ feature, hidden = false }: ComingSoonProps) {
  if (hidden) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
      <p className="text-base font-medium text-slate-700">준비 중인 기능입니다.</p>
      <p className="mt-2 text-sm">
        <span className="font-semibold text-slate-600">{feature}</span> 화면은 현재 설계 단계에 있으며, 곧
        제공될 예정입니다.
      </p>
    </div>
  );
}












