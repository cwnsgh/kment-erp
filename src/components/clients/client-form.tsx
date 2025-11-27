'use client';

import { Plus, Trash2, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, checkBusinessRegistrationNumber } from '@/app/actions/client';
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
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const businessRegistrationFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([
    { id: createId(), name: '', phone: '', email: '', title: '', note: '' }
  ]);
  const [sites, setSites] = useState<Site[]>([
    { id: createId(), brandName: '', domain: '', solution: '', loginId: '', loginPassword: '', note: '' }
  ]);
  const [attachments, setAttachments] = useState<Array<{ fileUrl: string; fileName: string; fileType: 'business_registration' | 'signature' }>>([]);
  // 선택한 파일을 임시로 저장 (아직 업로드 안 함)
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; fileType: 'business_registration' | 'signature' }>>([]);
  // 사업자 상태 (API에서 가져온 정보)
  const [businessStatus, setBusinessStatus] = useState<'정상' | '휴업' | '폐업' | null>(null);

  const addContact = () =>
    setContacts((prev) => [...prev, { id: createId(), name: '', phone: '', email: '', title: '', note: '' }]);
  const removeContact = (id: string) => setContacts((prev) => prev.filter((contact) => contact.id !== id));

  const addSite = () =>
    setSites((prev) => [...prev, { id: createId(), brandName: '', domain: '', solution: '', loginId: '', loginPassword: '', note: '' }]);
  const removeSite = (id: string) => setSites((prev) => prev.filter((site) => site.id !== id));

  // 중복확인
  const handleCheckDuplicate = async () => {
    const input = document.querySelector('input[name="businessRegistrationNumber"]') as HTMLInputElement;
    const businessNumber = input?.value.trim();

    if (!businessNumber) {
      alert('사업자등록번호를 입력해주세요.');
      return;
    }

    setCheckingDuplicate(true);
    setDuplicateCheckResult('');

    const result = await checkBusinessRegistrationNumber(businessNumber);

    setCheckingDuplicate(false);

    if (result.success && !result.isDuplicate) {
      let message = '사용 가능한 사업자등록번호입니다.';
      if (result.businessStatus) {
        // 상태 자동 반영
        const statusMap: Record<string, '정상' | '휴업' | '폐업'> = {
          approved: '정상',
          suspended: '휴업',
          closed: '폐업',
        };
        const newStatus = statusMap[result.businessStatus.status] || '정상';
        setBusinessStatus(newStatus);
        
        // 숨겨진 input에 상태 저장 (제출 시 사용)
        const statusInput = document.querySelector('input[name="status"]') as HTMLInputElement;
        if (statusInput) {
          statusInput.value = newStatus;
        }
        
        message += `\n사업자 상태: ${result.businessStatus.statusText} (자동 반영됨)`;
      }
      setDuplicateCheckResult(message);
      alert(message);
    } else {
      // 에러 발생 시 상태 초기화
      setBusinessStatus(null);
      
      // 숨겨진 input의 value도 초기화
      const statusInput = document.querySelector('input[name="status"]') as HTMLInputElement;
      if (statusInput) {
        statusInput.value = '정상'; // 기본값으로 초기화
      }
      
      // 에러 메시지 우선 표시 (error 필드가 있으면 사용)
      const errorMessage = result.error || result.message || '이미 등록된 사업자등록번호이거나 확인할 수 없습니다.';
      setDuplicateCheckResult(errorMessage);
      alert(errorMessage);
    }
  };

  // 파일 선택 시 state에 저장 (아직 업로드 안 함)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'business_registration' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (30MB)
      if (file.size > 30 * 1024 * 1024) {
        alert('파일 크기는 30MB 이하여야 합니다.');
        return;
      }
      
      // 같은 타입의 기존 파일 제거하고 새 파일 추가
      setPendingFiles((prev) => [
        ...prev.filter((f) => f.fileType !== fileType),
        { file, fileType },
      ]);
      
      // input 초기화 (같은 파일을 다시 선택할 수 있도록)
      e.target.value = '';
    }
  };

  // 파일 업로드 (저장/수정 버튼 클릭 시 호출)
  const uploadPendingFiles = async (): Promise<Array<{ fileUrl: string; fileName: string; fileType: 'business_registration' | 'signature' }>> => {
    if (pendingFiles.length === 0) return [];

    setUploading(true);
    const uploadedFiles: Array<{ fileUrl: string; fileName: string; fileType: 'business_registration' | 'signature' }> = [];

    try {
      for (const { file, fileType } of pendingFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', fileType === 'business_registration' ? 'business-registration' : 'signature');

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
          throw new Error(errorData.error || `서버 오류 (${response.status})`);
        }

        const result = await response.json();

        if (result.success) {
          uploadedFiles.push({
            fileUrl: result.url,
            fileName: result.fileName,
            fileType,
          });
        } else {
          throw new Error(result.error || '파일 업로드 실패');
        }
      }

      return uploadedFiles;
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      throw new Error(`파일 업로드 실패: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. 선택한 파일들 먼저 업로드
      const uploadedFiles = await uploadPendingFiles();
      
      // 2. 업로드된 파일들을 attachments에 추가 (기존 파일과 병합)
      const allAttachments = [
        ...attachments.filter((a) => !pendingFiles.some((pf) => pf.fileType === a.fileType)), // 기존 파일 중 pendingFiles와 타입이 다른 것만 유지
        ...uploadedFiles,
      ];

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
        status: (formData.get('status') as string) || '정상', // API에서 가져온 상태 또는 기본값
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
        attachments: allAttachments,
      });

      if (result.success) {
        alert('거래처가 등록되었습니다.');
        router.push('/clients');
      } else {
        alert('등록 실패: ' + result.error);
      }
    } catch (error) {
      console.error('등록 오류:', error);
      alert(error instanceof Error ? error.message : '등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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
            <div className="flex-1">
              <Field name="businessRegistrationNumber" label="사업자 등록번호" placeholder="123-45-67890" required className="w-full" />
              {duplicateCheckResult && (
                <p className={`mt-1 text-xs ${duplicateCheckResult.includes('사용 가능') ? 'text-green-600' : 'text-red-600'}`}>
                  {duplicateCheckResult}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleCheckDuplicate}
              disabled={checkingDuplicate}
              className="mt-6 h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {checkingDuplicate ? '확인 중...' : '중복확인'}
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
        {/* 숨겨진 상태 필드 (API 결과 저장용) */}
        <input type="hidden" name="status" value={businessStatus || '정상'} />
        {businessStatus && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-700">사업자 상태:</span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                businessStatus === '정상' ? 'bg-blue-50 text-blue-600' :
                businessStatus === '폐업' ? 'bg-red-50 text-red-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {businessStatus}
              </span>
              <span className="text-xs text-blue-500">(국세청 API 기준, 자동 반영됨)</span>
            </div>
          </div>
        )}
        <div className="mt-6">
          <label className="block text-sm font-semibold text-slate-700">사업자 등록증 첨부</label>
          <div className="mt-2 space-y-2">
            {/* 이미 업로드된 파일 */}
            {attachments
              .filter((a) => a.fileType === 'business_registration')
              .map((attachment, index) => {
                const isImage = attachment.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                const fileSize = attachment.fileUrl ? '업로드됨' : '';
                return (
                  <div key={index} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    {isImage && attachment.fileUrl ? (
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="h-10 w-10 rounded object-cover"
                        onClick={() => window.open(attachment.fileUrl, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-200">
                        <span className="text-xs text-slate-500">📄</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {attachment.fileUrl ? (
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-slate-700 hover:text-primary hover:underline"
                          >
                            {attachment.fileName}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-600">{attachment.fileName}</span>
                        )}
                        {fileSize && <span className="text-xs text-slate-400">({fileSize})</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((a, i) => !(a.fileType === 'business_registration' && i === index)))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            {/* 선택한 파일 (아직 업로드 안 함) */}
            {pendingFiles
              .filter((f) => f.fileType === 'business_registration')
              .map((pendingFile, index) => {
                const isImage = pendingFile.file.type.startsWith('image/');
                const fileSize = (pendingFile.file.size / 1024 / 1024).toFixed(2) + ' MB';
                const previewUrl = isImage ? URL.createObjectURL(pendingFile.file) : null;
                return (
                  <div key={index} className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                    {isImage && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={pendingFile.file.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-200">
                        <span className="text-xs text-blue-600">📄</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-700">{pendingFile.file.name}</span>
                        <span className="text-xs text-blue-500">({fileSize})</span>
                        <span className="text-xs text-blue-500">업로드 대기 중</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setPendingFiles((prev) => prev.filter((f, i) => !(f.fileType === 'business_registration' && i === index)));
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            <div
              className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 cursor-pointer hover:bg-slate-100 transition"
              onClick={() => businessRegistrationFileInputRef.current?.click()}
            >
              <Upload size={16} className="text-slate-400" />
              <span className="font-medium text-slate-600">파일을 드래그하거나 클릭하여 선택</span>
              <input
                ref={businessRegistrationFileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'business_registration')}
                disabled={uploading || loading}
              />
              <button
                type="button"
                disabled={uploading || loading}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                파일 선택
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-semibold text-slate-700">서명 등록</label>
          <div className="mt-2 space-y-2">
            {/* 이미 업로드된 파일 */}
            {attachments
              .filter((a) => a.fileType === 'signature')
              .map((attachment, index) => {
                const isImage = attachment.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                const fileSize = attachment.fileUrl ? '업로드됨' : '';
                return (
                  <div key={index} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    {isImage && attachment.fileUrl ? (
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="h-10 w-10 rounded object-cover"
                        onClick={() => window.open(attachment.fileUrl, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-200">
                        <span className="text-xs text-slate-500">📄</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {attachment.fileUrl ? (
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-slate-700 hover:text-primary hover:underline"
                          >
                            {attachment.fileName}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-600">{attachment.fileName}</span>
                        )}
                        {fileSize && <span className="text-xs text-slate-400">({fileSize})</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((a, i) => !(a.fileType === 'signature' && i === index)))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            {/* 선택한 파일 (아직 업로드 안 함) */}
            {pendingFiles
              .filter((f) => f.fileType === 'signature')
              .map((pendingFile, index) => {
                const isImage = pendingFile.file.type.startsWith('image/');
                const fileSize = (pendingFile.file.size / 1024 / 1024).toFixed(2) + ' MB';
                const previewUrl = isImage ? URL.createObjectURL(pendingFile.file) : null;
                return (
                  <div key={index} className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                    {isImage && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={pendingFile.file.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-200">
                        <span className="text-xs text-blue-600">📄</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-700">{pendingFile.file.name}</span>
                        <span className="text-xs text-blue-500">({fileSize})</span>
                        <span className="text-xs text-blue-500">업로드 대기 중</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setPendingFiles((prev) => prev.filter((f, i) => !(f.fileType === 'signature' && i === index)));
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            <div
              className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 cursor-pointer hover:bg-slate-100 transition"
              onClick={() => signatureFileInputRef.current?.click()}
            >
              <Upload size={16} className="text-slate-400" />
              <span className="font-medium text-slate-600">파일을 드래그하거나 클릭하여 선택</span>
              <input
                ref={signatureFileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'signature')}
                disabled={uploading || loading}
              />
              <button
                type="button"
                disabled={uploading || loading}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                파일 선택
              </button>
            </div>
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
          onClick={() => {
            setPendingFiles([]);
            router.back();
          }}
          className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {loading || uploading ? (uploading ? '파일 업로드 중...' : '등록 중...') : '거래처 등록'}
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

