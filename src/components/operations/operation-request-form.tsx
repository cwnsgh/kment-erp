'use client';

import { ReactNode, useState } from 'react';

const approvalOptions = [
  { label: '메일 승인', value: 'email' },
  { label: 'SMS 승인', value: 'sms' },
  { label: '포털 승인', value: 'portal' }
];

export function OperationRequestForm() {
  const [approvalMethod, setApprovalMethod] = useState('portal');

  return (
    <form className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">요청 기본 정보</h2>
          <p className="mt-1 text-sm text-slate-500">관리 업무 요청서를 작성하고 고객 승인 절차를 진행합니다.</p>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="거래처 선택">
            <option value="">거래처를 선택하세요</option>
            <option value="C-001">누리테크</option>
            <option value="C-002">에이펙스몰</option>
          </Field>
          <Field label="관련 계약">
            <option value="">계약을 선택하세요</option>
            <option value="CON-2024-012">에이펙스몰 플랫폼 전환</option>
          </Field>
          <Field label="업무 제목" inputType="text" placeholder="예: 5월 프로모션 배너 교체" />
          <Field label="업무 유형">
            <option value="운영 지원">운영 지원</option>
            <option value="장애 대응">장애 대응</option>
            <option value="정기 점검">정기 점검</option>
          </Field>
          <Field label="예상 시작일" inputType="date" />
          <Field label="예상 종료일" inputType="date" />
          <Field label="작업 담당자" inputType="text" placeholder="내부 담당자 이름" />
          <Field label="협업자" inputType="text" placeholder="필요 시 추가 담당자 기입" />
        </div>
        <Field label="요청 상세 내용" inputType="textarea" placeholder="작업 범위, 요구사항, 필요 자료를 구체적으로 작성하세요." />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">승인 프로세스</h2>
          <p className="mt-1 text-sm text-slate-500">승인 방법과 요청 메시지를 설정합니다.</p>
        </header>
        <div className="mt-4 space-y-4">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-700">승인 요청 방식</legend>
            {approvalOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="radio"
                  name="approvalMethod"
                  value={option.value}
                  checked={approvalMethod === option.value}
                  onChange={(event) => setApprovalMethod(event.target.value)}
                  className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <Field
            label="승인 메시지"
            inputType="textarea"
            placeholder="고객에게 전송될 승인 요청 내용을 작성하세요."
          />
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            <p className="font-semibold text-slate-600">첨부 파일</p>
            <p className="mt-1">작업 안내서, 디자인 시안 등 참고 자료를 업로드하세요.</p>
            <button
              type="button"
              className="mt-3 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              파일 선택
            </button>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          임시 저장
        </button>
        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          승인 요청 보내기
        </button>
      </section>
    </form>
  );
}

type FieldProps = {
  label: string;
  inputType?: 'text' | 'textarea' | 'date';
  placeholder?: string;
  children?: ReactNode;
};

function Field({ label, inputType = 'text', placeholder, children }: FieldProps) {
  if (children) {
    return (
      <label className="block text-sm font-medium text-slate-700">
        {label}
        <select className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
          {children}
        </select>
      </label>
    );
  }

  if (inputType === 'textarea') {
    return (
      <label className="block text-sm font-medium text-slate-700">
        {label}
        <textarea
          rows={4}
          placeholder={placeholder}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
    );
  }

  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type={inputType}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}

