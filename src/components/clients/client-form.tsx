'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/actions/client';
import AddressSearch from '@/components/common/address-search';

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  title: string;
  note: string;
};

type Site = {
  id: string;
  brandName: string;
  domain: string;
  solution: string;
  loginId: string;
  loginPassword: string;
  note: string;
};

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export function ClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([
    { id: createId(), name: '', phone: '', email: '', title: '', note: '' }
  ]);
  const [sites, setSites] = useState<Site[]>([
    { id: createId(), brandName: '', domain: '', solution: '', loginId: '', loginPassword: '', note: '' }
  ]);
  const [attachments, setAttachments] = useState<Array<{ fileUrl: string; fileName: string; fileType: 'business_registration' | 'signature' }>>([]);

  const addContact = () =>
    setContacts((prev) => [...prev, { id: createId(), name: '', phone: '', email: '', title: '', note: '' }]);
  const removeContact = (id: string) => setContacts((prev) => prev.filter((contact) => contact.id !== id));

  const addSite = () =>
    setSites((prev) => [...prev, { id: createId(), brandName: '', domain: '', solution: '', loginId: '', loginPassword: '', note: '' }]);
  const removeSite = (id: string) => setSites((prev) => prev.filter((site) => site.id !== id));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // 기본 정보 수집
    const clientData = {
      businessRegistrationNumber: formData.get('businessRegistrationNumber') as string,
      name: formData.get('name') as string,
      ceoName: formData.get('ceoName') as string,
      address: formData.get('address') as string,
      addressDetail: formData.get('addressDetail') as string,
      businessType: formData.get('businessType') as string,
      businessItem: formData.get('businessItem') as string,
      loginId: formData.get('loginId') as string,
      loginPassword: formData.get('loginPassword') as string,
      note: formData.get('note') as string,
    };

    // 담당자 정보 수집
    const contactsData = contacts.map((contact) => ({
      name: formData.get(`contact_${contact.id}_name`) as string,
      phone: formData.get(`contact_${contact.id}_phone`) as string,
      email: formData.get(`contact_${contact.id}_email`) as string,
      title: formData.get(`contact_${contact.id}_title`) as string,
      note: formData.get(`contact_${contact.id}_note`) as string,
    }));

    // 사이트 정보 수집
    const sitesData = sites.map((site) => ({
      brandName: formData.get(`site_${site.id}_brandName`) as string,
      domain: formData.get(`site_${site.id}_domain`) as string,
      solution: formData.get(`site_${site.id}_solution`) as string,
      loginId: formData.get(`site_${site.id}_loginId`) as string,
      loginPassword: formData.get(`site_${site.id}_loginPassword`) as string,
      note: formData.get(`site_${site.id}_note`) as string,
    }));

    // Server Action 호출 (한 번에 모든 데이터 전송)
    const result = await createClient({
      ...clientData,
      contacts: contactsData,
      sites: sitesData,
      attachments: attachments,
    });

    setLoading(false);

    if (result.success) {
      alert('거래처가 등록되었습니다.');
      router.push('/clients');
    } else {
      alert('등록 실패: ' + result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">기본 정보</h2>
          <p className="mt-1 text-sm text-slate-500">사업자 및 로그인 정보를 입력합니다.</p>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex gap-2">
            <Field name="businessRegistrationNumber" label="사업자 등록번호" placeholder="123-45-67890" required className="flex-1" />
            <button
              type="button"
              className="mt-6 h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              중복확인
            </button>
          </div>
          <Field name="name" label="상호(법인명)" required />
          <Field name="ceoName" label="대표자명" />
          <div className="flex gap-2">
            <Field name="address" label="사업자 주소" className="flex-1" />
            <AddressSearch
              onComplete={(data) => {
                const addressInput = document.querySelector('input[name="address"]') as HTMLInputElement;
                const postalCodeInput = document.querySelector('input[name="postalCode"]') as HTMLInputElement;
                if (addressInput) {
                  addressInput.value = data.address + (data.buildingName ? ` ${data.buildingName}` : '');
                  // input 이벤트 발생시켜서 React가 인식하도록
                  addressInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                if (postalCodeInput) {
                  postalCodeInput.value = data.zonecode;
                  postalCodeInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}
            >
              <button
                type="button"
                className="mt-6 h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                주소검색
              </button>
            </AddressSearch>
          </div>
          <Field name="postalCode" label="우편번호" className="opacity-75" readOnly />
          <Field name="addressDetail" label="상세 주소" />
          <Field name="businessType" label="업태" />
          <Field name="businessItem" label="종목" />
          <Field name="loginId" label="거래처 아이디" />
          <Field name="loginPassword" label="거래처 비밀번호" type="password" />
        </div>
        <div className="mt-6">
          <label className="block text-sm font-semibold text-slate-700">사업자 등록증 첨부</label>
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            <span className="font-medium text-slate-600">파일을 드래그하거나 클릭하여 업로드</span>
            <button
              type="button"
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              파일 선택
            </button>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-semibold text-slate-700">비고</label>
          <textarea
            name="note"
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="추가 정보를 입력하세요"
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">담당자 정보</h2>
            <p className="mt-1 text-sm text-slate-500">담당자는 여러 명을 등록할 수 있습니다.</p>
          </div>
          <button
            type="button"
            onClick={addContact}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <Plus size={16} />
            담당자 추가
          </button>
        </header>
        <div className="mt-6 space-y-6">
          {contacts.map((contact, index) => (
            <div key={contact.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">담당자 {index + 1}</p>
                {contacts.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeContact(contact.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field name={`contact_${contact.id}_name`} label="이름" required />
                <Field name={`contact_${contact.id}_phone`} label="연락처" placeholder="010-1234-5678" />
                <Field name={`contact_${contact.id}_email`} label="이메일" type="email" />
                <Field name={`contact_${contact.id}_title`} label="직책" />
                <Field name={`contact_${contact.id}_note`} label="비고" className="md:col-span-2" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">거래처 사이트</h2>
            <p className="mt-1 text-sm text-slate-500">브랜드별 사이트 정보를 관리합니다.</p>
          </div>
          <button
            type="button"
            onClick={addSite}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <Plus size={16} />
            사이트 추가
          </button>
        </header>
        <div className="mt-6 space-y-6">
          {sites.map((site, index) => (
            <div key={site.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">사이트 {index + 1}</p>
                {sites.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeSite(site.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field name={`site_${site.id}_brandName`} label="브랜드명" />
                <Field name={`site_${site.id}_domain`} label="도메인" placeholder="https://example.com" />
                <Field name={`site_${site.id}_solution`} label="솔루션" placeholder="Cafe24, 고도몰 등" />
                <Field name={`site_${site.id}_loginId`} label="사이트 아이디" />
                <Field name={`site_${site.id}_loginPassword`} label="사이트 비밀번호" type="password" />
                <Field name={`site_${site.id}_note`} label="비고" className="md:col-span-2" />
              </div>
            </div>
          ))}
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
          disabled={loading}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {loading ? '등록 중...' : '거래처 등록'}
        </button>
      </section>
    </form>
  );
}

type FieldProps = {
  name?: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
};

function Field({ name, label, required, type = 'text', placeholder, className, readOnly }: FieldProps) {
  return (
    <label className={`block text-sm ${className || ''}`}>
      <span className="font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-slate-100 disabled:cursor-not-allowed"
      />
    </label>
  );
}

