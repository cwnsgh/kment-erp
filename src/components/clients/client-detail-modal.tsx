"use client";

import { X, Download, Eye } from "lucide-react";
import styles from "./client-detail-modal.module.css";

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
  status: "정상" | "휴업" | "폐업";
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

export function ClientDetailModal({
  client,
  isOpen,
  onClose,
}: ClientDetailModalProps) {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 z-10">
          <h2 className="text-xl font-semibold text-slate-900">
            거래처 상세조회
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* 내용 */}
        <div className={`${styles.clientDetailModalWrapper} white_box`} style={{ paddingBottom: "80px" }}>
          <div className="table_group">
            {/* ERP 정보 */}
            <div className="table_item">
              <h2 className="table_title">ERP 정보</h2>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">아이디</div>
                  <div className="table_data">{client.loginId || ""}</div>
                </li>
                <li className="row_group">
                  <div className="table_head">패스워드</div>
                  <div className="table_data">{client.loginPassword || ""}</div>
                </li>
              </ul>
            </div>

            {/* 기본 정보 */}
            <div className="table_item">
              <h2 className="table_title">기본 정보</h2>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">거래처 사업자등록번호</div>
                  <div className="table_data">
                    {client.businessRegistrationNumber}
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">상호(법인명)</div>
                  <div className="table_data">{client.name}</div>
                </li>
                <li className="row_group">
                  <div className="table_head">대표자</div>
                  <div className="table_data">{client.ceoName || ""}</div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">사업자 주소</div>
                  <div className="table_data">{client.address || ""}</div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">업태</div>
                  <div className="table_data">{client.businessType || ""}</div>
                </li>
                <li className="row_group">
                  <div className="table_head">종목</div>
                  <div className="table_data">{client.businessItem || ""}</div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">사업자 등록증 첨부</div>
                  <div className="table_data">
                    {client.businessRegistrationFile ? (
                      <div className="flex items-center gap-2">
                        {client.businessRegistrationFileUrl ? (
                          <>
                            <a
                              href={client.businessRegistrationFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-slate-700 hover:text-primary hover:underline"
                            >
                              {client.businessRegistrationFile}
                            </a>
                            <a
                              href={client.businessRegistrationFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-800"
                              title="새 탭에서 열기"
                            >
                              <Eye size={14} />
                            </a>
                            <a
                              href={client.businessRegistrationFileUrl}
                              download={client.businessRegistrationFile}
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-800"
                              title="다운로드"
                            >
                              <Download size={14} />
                            </a>
                          </>
                        ) : (
                          <span className="text-sm text-slate-600">
                            {client.businessRegistrationFile}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        등록된 파일이 없습니다
                      </span>
                    )}
                  </div>
                </li>
                <li className="row_group">
                  <div className="table_head">서명 등록</div>
                  <div className="table_data">
                    {client.signatureFile ? (
                      <div className="flex items-center gap-2">
                        {client.signatureFileUrl ? (
                          <>
                            <a
                              href={client.signatureFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-slate-700 hover:text-primary hover:underline"
                            >
                              {client.signatureFile}
                            </a>
                            <a
                              href={client.signatureFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-800"
                              title="새 탭에서 열기"
                            >
                              <Eye size={14} />
                            </a>
                            <a
                              href={client.signatureFileUrl}
                              download={client.signatureFile}
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-800"
                              title="다운로드"
                            >
                              <Download size={14} />
                            </a>
                          </>
                        ) : (
                          <span className="text-sm text-slate-600">
                            {client.signatureFile}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        등록된 파일이 없습니다
                      </span>
                    )}
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">상태</div>
                  <div className="table_data">
                    <span
                      className={`text-sm font-medium ${
                        client.status === "정상"
                          ? "text-blue-600"
                          : client.status === "폐업"
                          ? "text-red-600"
                          : "text-slate-600"
                      }`}
                    >
                      {client.status}
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* 담당자 정보 */}
            {client.contacts.map((contact, index) => (
              <div key={index} className="table_item">
                <h3 className="table_title_sub">담당자{index + 1}</h3>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">이름</div>
                    <div className="table_data">{contact.name}</div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">연락처</div>
                    <div className="table_data">{contact.phone || ""}</div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">이메일</div>
                    <div className="table_data">{contact.email || ""}</div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">비고</div>
                    <div className="table_data">{contact.note || ""}</div>
                  </li>
                </ul>
              </div>
            ))}

            {/* 사이트 정보 */}
            <div className="table_item table_item2_modal">
              <h2 className="table_title">사이트 정보</h2>
              <ul className="table_row">
                <li className="row_group_modal">
                  <div className="table_head width20">브랜드</div>
                  <div className="table_head width20">도메인</div>
                  <div className="table_head width15">솔루션</div>
                  <div className="table_head width15">아이디</div>
                  <div className="table_head width15">패스워드</div>
                  <div className="table_head width15">유형</div>
                </li>
              </ul>
              {client.sites.length > 0 ? (
                client.sites.map((site, index) => (
                  <ul key={index} className="table_row">
                    <li className="row_group_modal">
                      <div className="table_data width20">
                        {site.brandName || ""}
                      </div>
                      <div className="table_data width20">
                        {site.domain || ""}
                      </div>
                      <div className="table_data width15">
                        {site.solution || ""}
                      </div>
                      <div className="table_data width15">
                        {site.loginId || ""}
                      </div>
                      <div className="table_data width15">
                        {site.loginPassword || ""}
                      </div>
                      <div className="table_data width15">
                        {site.type || ""}
                      </div>
                    </li>
                  </ul>
                ))
              ) : (
                <ul className="table_row">
                  <li className="row_group_modal">
                    <div
                      className="table_data"
                      style={{
                        width: "100%",
                        textAlign: "center",
                        padding: "20px",
                      }}
                    >
                      등록된 사이트가 없습니다
                    </div>
                  </li>
                </ul>
              )}
            </div>

            {/* 비고 */}
            <div className="table_item">
              <h2 className="table_title">비고</h2>
              <div className="text_box scroll">
                <p>{client.note || ""}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 flex items-center justify-center border-t border-slate-200 bg-white px-6 py-4 z-20">
          <div className="btn_wrap">
            <button
              type="button"
              onClick={onClose}
              className="btn btn_lg normal"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.href = `/clients/${client.id}/edit`;
              }}
              className="btn btn_lg primary"
            >
              수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
