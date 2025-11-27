'use client';

import { X, Download, Eye } from 'lucide-react';

type ClientDetail = {
  id: string;
  loginId?: string;
  loginPassword?: string;
  businessRegistrationNumber: string;
  name: string;
  address?: string;
  ceoName?: string;
  businessType?: string;
  businessItem?: string;
  businessRegistrationFile?: string;
  businessRegistrationFileUrl?: string;
  signatureFile?: string;
  signatureFileUrl?: string;
  status: '정상' | '휴업' | '폐업';
  contacts: Array<{
    name: string;
    phone?: string;
    email?: string;
    note?: string;
  }>;
  sites: Array<{
    brandName?: string;
    solution?: string;
    domain?: string;
    loginId?: string;
    loginPassword?: string;
    type?: string;
  }>;
  note?: string;
};

type ClientDetailModalProps = {
  client: ClientDetail | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ClientDetailModal({ client, isOpen, onClose }: ClientDetailModalProps) {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">거래처 상세조회</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* ERP 정보 */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">ERP 정보</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex items-center">
                <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">아이디</label>
                <input
                  type="text"
                  value={client.loginId || ''}
                  readOnly
                  className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <div className="flex items-center">
                <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">패스워드</label>
                <input
                  type="password"
                  value={client.loginPassword || ''}
                  readOnly
                  className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </div>
            </div>
          </section>

          {/* 기본 정보 */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">기본 정보</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex items-center">
                <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">거래처 사업자등록번호</label>
                <input
                  type="text"
                  value={client.businessRegistrationNumber}
                  readOnly
                  className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <div className="flex items-center">
                <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">상호(법인명)</label>
                <input
                  type="text"
                  value={client.name}
                  readOnly
                  className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <div className="col-span-2 flex items-center">
                <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">사업자주소</label>
                <input
                  type="text"
                  value={client.address || ''}
                  readOnly
                  className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <div className="flex items-center">
                <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">대표자</label>
                <input
                  type="text"
                  value={client.ceoName || ''}
                  readOnly
                  className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <div className="flex items-center">
                <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">업태</label>
                <input
                  type="text"
                  value={client.businessType || ''}
                  readOnly
                  className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <div className="flex items-center">
                <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">종목</label>
                <input
                  type="text"
                  value={client.businessItem || ''}
                  readOnly
                  className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <div className="flex items-center">
                <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">사업자 등록증</label>
                <div className="flex-1 flex items-center gap-2">
                  {client.businessRegistrationFile ? (
                    <>
                      {client.businessRegistrationFileUrl ? (
                        <>
                          <a
                            href={client.businessRegistrationFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary hover:underline"
                          >
                            {client.businessRegistrationFile}
                          </a>
                          <a
                            href={client.businessRegistrationFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            title="새 탭에서 열기"
                          >
                            <Eye size={14} />
                          </a>
                          <a
                            href={client.businessRegistrationFileUrl}
                            download={client.businessRegistrationFile}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            title="다운로드"
                          >
                            <Download size={14} />
                          </a>
                        </>
                      ) : (
                        <span className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          {client.businessRegistrationFile}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                      등록된 파일이 없습니다
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">서명 등록</label>
                <div className="flex-1 flex items-center gap-2">
                  {client.signatureFile ? (
                    <>
                      {client.signatureFileUrl ? (
                        <>
                          <a
                            href={client.signatureFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary hover:underline"
                          >
                            {client.signatureFile}
                          </a>
                          <a
                            href={client.signatureFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            title="새 탭에서 열기"
                          >
                            <Eye size={14} />
                          </a>
                          <a
                            href={client.signatureFileUrl}
                            download={client.signatureFile}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            title="다운로드"
                          >
                            <Download size={14} />
                          </a>
                        </>
                      ) : (
                        <span className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          {client.signatureFile}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                      등록된 파일이 없습니다
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">휴·폐업 상태</label>
                <div className="flex-1">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      client.status === '정상'
                        ? 'bg-blue-50 text-blue-600'
                        : client.status === '폐업'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {client.status}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 담당자 정보 */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">담당자 정보</h3>
            <div className="space-y-4">
              {client.contacts.map((contact, index) => (
                <div key={index} className="rounded-lg border border-slate-200 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-700">담당자 {index + 1}</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                      <label className="w-24 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">이름</label>
                      <input
                        type="text"
                        value={contact.name}
                        readOnly
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="w-24 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">연락처</label>
                      <input
                        type="text"
                        value={contact.phone || ''}
                        readOnly
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="w-24 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">이메일</label>
                      <input
                        type="email"
                        value={contact.email || ''}
                        readOnly
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                    <div className="col-span-2 flex items-center">
                      <label className="w-24 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">비고</label>
                      <input
                        type="text"
                        value={contact.note || ''}
                        readOnly
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 사이트 정보 */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">사이트 정보</h3>
            <div className="space-y-4">
              {client.sites.map((site, index) => (
                <div key={index} className="rounded-lg border border-slate-200 p-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                      <label className="w-24 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">브랜드</label>
                      <input
                        type="text"
                        value={site.brandName || ''}
                        readOnly
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="w-24 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">솔루션</label>
                      <input
                        type="text"
                        value={site.solution || ''}
                        readOnly
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                    <div className="col-span-2 flex items-center">
                      <label className="w-24 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">도메인</label>
                      <input
                        type="text"
                        value={site.domain || ''}
                        readOnly
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="w-24 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">아이디</label>
                      <input
                        type="text"
                        value={site.loginId || ''}
                        readOnly
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="w-24 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">패스워드</label>
                      <input
                        type="password"
                        value={site.loginPassword || ''}
                        readOnly
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="w-24 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">유형</label>
                      <input
                        type="text"
                        value={site.type || ''}
                        readOnly
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 비고 */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">비고</h3>
            <div className="flex items-start">
              <label className="w-32 flex-shrink-0 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">비고</label>
              <textarea
                value={client.note || ''}
                readOnly
                rows={4}
                className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
            </div>
          </section>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 flex items-center justify-center border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              window.location.href = `/clients/${client.id}/edit`;
            }}
            className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            수정
          </button>
        </div>
      </div>
    </div>
  );
}

