'use client';

import { useState } from 'react';

const contractTypes = ['유지보수', '플랫폼 구축', '운영 대행', '컨설팅'];
const contractStatuses = ['초안', '검토 중', '진행 중', '종료'];

export function ContractForm() {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedType, setSelectedType] = useState(contractTypes[0]);
  const [selectedStatus, setSelectedStatus] = useState(contractStatuses[0]);

  return (
    <form className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">계약 기본 정보</h2>
          <p className="mt-1 text-sm text-slate-500">계약 생성에 필요한 기본 정보를 입력합니다.</p>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">
              거래처 선택<span className="ml-1 text-red-500">*</span>
            </span>
            <select
              value={selectedClient}
              onChange={(event) => setSelectedClient(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">거래처를 선택하세요</option>
              <option value="C-001">누리테크</option>
              <option value="C-002">에이펙스몰</option>
              <option value="C-003">베타리빙</option>
            </select>
          </label>
          <Field label="계약명" placeholder="예: 누리테크 유지보수 2024" required />
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">계약 유형</span>
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {contractTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <Field label="총 계약 금액 (원)" type="number" placeholder="18000000" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="시작일" type="date" required />
            <Field label="종료일" type="date" />
          </div>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">계약 상태</span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {contractStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <Field label="담당자" placeholder="내부 담당자 이름" />
          <Field label="담당자 연락처" placeholder="010-0000-0000" />
        </div>
        <div className="mt-4">
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">계약 비고</span>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="특이사항, 지불 조건, SLA 등을 기록합니다."
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">첨부 및 내부 메모</h2>
          <p className="mt-1 text-sm text-slate-500">계약서 스캔본, 협의 메모 등 관련 자료를 첨부합니다.</p>
        </header>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            <p className="font-semibold text-slate-600">계약서 파일 업로드</p>
            <p className="mt-1">PDF 또는 이미지 파일을 업로드하세요. 최대 10MB.</p>
            <button
              type="button"
              className="mt-3 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              파일 선택
            </button>
          </div>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">내부 공유 메모</span>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="계약 진행에 참고해야 하는 내용을 기록하세요."
            />
          </label>
        </div>
      </section>

      <section className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          초안 저장
        </button>
        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          계약 등록
        </button>
      </section>
    </form>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
};

function Field({ label, required, type = 'text', placeholder }: FieldProps) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}

