import { ReactNode } from 'react';

export function ManagedClientForm() {
  return (
    <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header>
        <h2 className="text-base font-semibold text-slate-900">관리고객 등록</h2>
        <p className="mt-1 text-xs text-slate-500">계약 외 별도 관리가 필요한 고객을 등록합니다.</p>
      </header>
      <Field label="거래처 선택">
        <option value="">거래처를 선택하세요</option>
        <option value="C-001">누리테크</option>
        <option value="C-002">에이펙스몰</option>
      </Field>
      <Field label="관리 유형">
        <option value="정기점검">정기점검</option>
        <option value="이슈 대응">이슈 대응</option>
        <option value="프로모션 지원">프로모션 지원</option>
      </Field>
      <Field label="관리 시작일" inputType="date" />
      <Field label="담당자 메모" inputType="textarea" placeholder="관리 포인트, 유의 사항 등을 기록하세요." />
      <div className="flex items-center justify-end gap-2">
        <button
          type="reset"
          className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        >
          초기화
        </button>
        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          등록
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  children?: ReactNode;
  inputType?: 'text' | 'textarea' | 'date';
  placeholder?: string;
};

function Field({ label, children, inputType = 'text', placeholder }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children ? (
        <select className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
          {children}
        </select>
      ) : inputType === 'textarea' ? (
        <textarea
          rows={3}
          placeholder={placeholder}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <input
          type={inputType}
          placeholder={placeholder}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
    </label>
  );
}

