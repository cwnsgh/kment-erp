'use client';

import { Check, X, FileText, Download, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import { useState } from 'react';
import { approveSignupRequest, rejectSignupRequest, SignupRequest } from '@/app/actions/client-approval';
import { useRouter } from 'next/navigation';

interface SignupApprovalListProps {
  requests: SignupRequest[];
}

export function SignupApprovalList({ requests }: SignupApprovalListProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectForm, setShowRejectForm] = useState<{ [key: string]: boolean }>({});
  const [selectedRequest, setSelectedRequest] = useState<SignupRequest | null>(
    null
  );

  const handleApprove = async (clientId: string) => {
    setProcessingId(clientId);
    try {
      const result = await approveSignupRequest(clientId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || '승인 처리에 실패했습니다.');
      }
    } catch (error) {
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (clientId: string) => {
    const reason = rejectReason[clientId]?.trim();
    if (!reason) {
      alert('거절 사유를 입력해주세요.');
      return;
    }

    setProcessingId(clientId);
    try {
      const result = await rejectSignupRequest(clientId, reason);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || '거절 처리에 실패했습니다.');
      }
    } catch (error) {
      alert('거절 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
      setShowRejectForm({ ...showRejectForm, [clientId]: false });
      setRejectReason({ ...rejectReason, [clientId]: '' });
    }
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <p className="text-sm text-slate-600">승인 대기 중인 회원가입 요청이 없습니다.</p>
      </div>
    );
  }

  const renderRequestDetails = (
    request: SignupRequest,
    showActions: boolean
  ) => {
    const isProcessing = processingId === request.id;
    const showReject = showRejectForm[request.id];

    return (
      <>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900">기본 정보</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <dt className="font-medium text-slate-600">대표자:</dt>
                <dd className="text-slate-900">{request.ceo_name || "-"}</dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="font-medium text-slate-600">업태:</dt>
                <dd className="text-slate-900">{request.business_type || "-"}</dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="font-medium text-slate-600">종목:</dt>
                <dd className="text-slate-900">{request.business_item || "-"}</dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="font-medium text-slate-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> 주소:
                </dt>
                <dd className="text-slate-900">
                  {request.address || "-"} {request.address_detail || ""}
                </dd>
              </div>
            </dl>
          </div>

          {/* 담당자 정보 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900">담당자 정보</h4>
            <div className="space-y-3">
              {(request.contacts.length > 0
                ? request.contacts
                : [{ name: "-", phone: "-", email: "-", title: "-" }]
              ).map((contact, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center gap-2 font-medium text-slate-900">
                    <User className="h-4 w-4 text-slate-400" />
                    {contact.name || "-"}
                    {contact.title && contact.title !== "-" && (
                      <span className="text-xs text-slate-500">
                        ({contact.title})
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {contact.phone || "-"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {contact.email || "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 첨부파일 */}
        <div className="mt-6 space-y-2">
          <h4 className="font-semibold text-slate-900">첨부파일</h4>
          {request.attachments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {request.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span>{attachment.file_name || attachment.file_type}</span>
                  <Download className="h-3 w-3 text-slate-400" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">첨부파일이 없습니다.</p>
          )}
        </div>

        {showActions && (
          <>
            {/* 거절 사유 입력 */}
            {showReject && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <label className="block text-sm font-medium text-red-900">
                  거절 사유
                </label>
                <textarea
                  value={rejectReason[request.id] || ""}
                  onChange={(e) =>
                    setRejectReason({
                      ...rejectReason,
                      [request.id]: e.target.value,
                    })
                  }
                  placeholder="거절 사유를 입력해주세요."
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleReject(request.id)}
                    disabled={isProcessing}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    거절 확인
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectForm({
                        ...showRejectForm,
                        [request.id]: false,
                      });
                      setRejectReason({ ...rejectReason, [request.id]: "" });
                    }}
                    disabled={isProcessing}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            {!showReject && (
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleApprove(request.id)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  승인
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setShowRejectForm({ ...showRejectForm, [request.id]: true })
                  }
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  거절
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {requests.map((request) => {
        const isProcessing = processingId === request.id;
        const showReject = showRejectForm[request.id];

        return (
          <div
            key={request.id}
            className="rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <div
              className="border-b border-slate-200 bg-slate-50 px-6 py-4 cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedRequest(request)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedRequest(request);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Building2 className="h-5 w-5 text-slate-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{request.name}</h3>
                    <p className="text-sm text-slate-600">사업자등록번호: {request.business_registration_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                    승인 대기
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(request.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {renderRequestDetails(request, true)}
            </div>
          </div>
        );
      })}

      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setSelectedRequest(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setSelectedRequest(null);
            }
          }}
        >
          <div
            className="w-full max-w-3xl rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedRequest.name}
                </h3>
                <p className="text-sm text-slate-600">
                  사업자등록번호: {selectedRequest.business_registration_number}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-700"
                onClick={() => setSelectedRequest(null)}
              >
                닫기
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {renderRequestDetails(selectedRequest, false)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






