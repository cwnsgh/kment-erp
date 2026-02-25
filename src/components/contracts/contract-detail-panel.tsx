"use client";

import { useRouter } from "next/navigation";
import styles from "./contract-detail-panel.module.css";

export type ContractDetailData = {
  contract: {
    id: string;
    contract_name: string;
    contract_date: string;
    contract_type_name: string;
    draft_due_date: string | null;
    demo_due_date: string | null;
    final_completion_date: string | null;
    open_due_date: string | null;
    contract_amount: number;
    payment_progress: string;
    installment_amount: number | null;
    contract_note: string | null;
    contract_functionality: string | null;
    work_note: string | null;
    primary_contact_name: string | null;
    secondary_contact_name: string | null;
  };
  client: {
    business_registration_number: string;
    name: string;
    address: string | null;
    ceo_name: string | null;
    business_type: string | null;
    business_item: string | null;
    login_id: string | null;
    login_password: string | null;
    note: string | null;
  };
  sites: Array<{
    id: string;
    brand_name: string | null;
    domain: string | null;
    solution: string | null;
    login_id: string | null;
    login_password: string | null;
    note: string | null;
  }>;
  contacts: Array<{
    name: string;
    phone: string | null;
    email: string | null;
    note: string | null;
  }>;
  clientAttachments: Array<{
    file_name: string | null;
    file_url: string;
    file_type: string;
  }>;
  contractAttachments: Array<{
    file_name: string;
    file_url: string;
    file_type: string;
  }>;
};

type ContractDetailPanelProps = {
  detail: ContractDetailData | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatAmount(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return new Intl.NumberFormat("ko-KR").format(amount);
}

function paymentLabel(progress: string): string {
  const map: Record<string, string> = { paid: "완납", installment: "분납", unpaid: "미납" };
  return map[progress] ?? progress;
}

function FileLinks({ items, emptyText = "-" }: { items: Array<{ file_name: string | null; file_url: string }>; emptyText?: string }) {
  if (items.length === 0) return <>{emptyText}</>;
  return (
    <>
      {items.map((a, i) => (
        <span key={i}>
          {i > 0 && ", "}
          <a href={a.file_url} target="_blank" rel="noopener noreferrer" className={styles.attachLink}>
            {a.file_name ?? "파일"}
          </a>
        </span>
      ))}
    </>
  );
}

export function ContractDetailPanel({ detail, isOpen, onClose, isLoading }: ContractDetailPanelProps) {
  const router = useRouter();
  if (!isOpen) return null;

  const handleEdit = () => {
    if (detail?.contract.id) {
      onClose();
      router.push(`/contracts/${detail.contract.id}/edit`);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.contractDetailModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.detailModalHeader}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <h3>계약 상세조회</h3>
            <button type="button" onClick={onClose} className={styles.detailModalClose} aria-label="닫기" />
          </div>
        </div>

        <div className={`${styles.contractDetailModalWrapper} scroll`}>
          {isLoading ? (
            <div className={styles.loading}>로딩 중...</div>
          ) : !detail ? (
            <div className={styles.loading}>데이터가 없습니다.</div>
          ) : (
            <div className="table_group">
              {/* ERP 정보 */}
              <div className="table_item">
                <h2 className="table_title">ERP 정보</h2>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">아이디</div>
                    <div className="table_data">{detail.client.login_id ?? ""}</div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">패스워드</div>
                    <div className="table_data"></div>
                  </li>
                </ul>
              </div>

              {/* 기본 정보 */}
              <div className="table_item">
                <h2 className="table_title">기본 정보</h2>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">거래처 사업자등록번호</div>
                    <div className="table_data">{detail.client.business_registration_number}</div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">상호(법인명)</div>
                    <div className="table_data">{detail.client.name}</div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">대표자</div>
                    <div className="table_data">{detail.client.ceo_name ?? ""}</div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">사업자 주소</div>
                    <div className="table_data">{detail.client.address ?? ""}</div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">업태</div>
                    <div className="table_data">{detail.client.business_type ?? ""}</div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">종목</div>
                    <div className="table_data">{detail.client.business_item ?? ""}</div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">사업자 등록증 첨부</div>
                    <div className="table_data attach">
                      <FileLinks items={detail.clientAttachments.filter((a) => a.file_type === "business_registration")} emptyText="등록된 파일이 없습니다." />
                    </div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">주요업무 내용</div>
                    <div className="table_data">{detail.client.note ?? ""}</div>
                  </li>
                </ul>
              </div>

              {/* 담당자 정보 */}
              {detail.contacts.length > 0 ? (
                detail.contacts.map((contact, index) => (
                  <div key={index} className="table_item">
                    <h2 className="table_title">담당자 정보</h2>
                    <h3 className="table_title_sub">담당자{index + 1}</h3>
                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">이름</div>
                        <div className="table_data">{contact.name}</div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">연락처</div>
                        <div className="table_data">{contact.phone ?? ""}</div>
                      </li>
                    </ul>
                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">이메일</div>
                        <div className="table_data">{contact.email ?? ""}</div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">비고</div>
                        <div className="table_data">{contact.note ?? ""}</div>
                      </li>
                    </ul>
                  </div>
                ))
              ) : (
                <div className="table_item">
                  <h2 className="table_title">담당자 정보</h2>
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">이름</div>
                      <div className="table_data">등록된 담당자가 없습니다.</div>
                    </li>
                  </ul>
                </div>
              )}

              {/* 사이트 정보 */}
              <div className="table_item table_item2_modal">
                <h2 className="table_title">사이트 정보</h2>
                <ul className="table_row">
                  <li className="row_group_modal">
                    <div className="table_head width20">브랜드</div>
                    <div className="table_head width20">도메인</div>
                    <div className="table_head width20">솔루션</div>
                    <div className="table_head width20">아이디</div>
                    <div className="table_head width20">패스워드</div>
                  </li>
                </ul>
                {detail.sites.length > 0 ? (
                  detail.sites.map((site) => (
                    <ul key={site.id} className="table_row">
                      <li className="row_group_modal">
                        <div className="table_data width20">{site.brand_name ?? ""}</div>
                        <div className="table_data width20">{site.domain ?? ""}</div>
                        <div className="table_data width20">{site.solution ?? ""}</div>
                        <div className="table_data width20">{site.login_id ?? ""}</div>
                        <div className="table_data width20">{site.login_password ?? ""}</div>
                      </li>
                    </ul>
                  ))
                ) : (
                  <ul className="table_row">
                    <li className="row_group_modal">
                      <div className="table_data" style={{ width: "100%", textAlign: "center", padding: "20px" }}>
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
                  <p>{detail.client.note || ""}</p>
                </div>
              </div>

              {/* 계약 정보 */}
              <div className="table_item">
                <h2 className="table_title">계약 정보</h2>
                <h3 className="table_title_sub">{detail.contract.contract_name}</h3>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">계약명</div>
                    <div className="table_data">{detail.contract.contract_name}</div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">계약일</div>
                    <div className="table_data">{formatDate(detail.contract.contract_date)}</div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">계약 종목</div>
                    <div className="table_data">{detail.contract.contract_type_name || ""}</div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">시안 완료 예정일</div>
                    <div className="table_data">{formatDate(detail.contract.draft_due_date)}</div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">최종 완료일</div>
                    <div className="table_data">{formatDate(detail.contract.final_completion_date)}</div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">오픈 예정일</div>
                    <div className="table_data">{formatDate(detail.contract.final_completion_date)}</div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">계약금액</div>
                    <div className="table_data">{formatAmount(detail.contract.contract_amount)}</div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">진행상태</div>
                    <div className="table_data">
                      {paymentLabel(detail.contract.payment_progress)}
                      {detail.contract.payment_progress === "installment" && detail.contract.installment_amount != null && ` (${formatAmount(detail.contract.installment_amount)})`}
                    </div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">계약비고</div>
                    <div className="table_data">{detail.contract.contract_note ?? ""}</div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">계약가능성</div>
                    <div className="table_data">{detail.contract.contract_functionality ?? ""}</div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">계약서 첨부</div>
                    <div className="table_data attach">
                      <FileLinks items={detail.contractAttachments.filter((a) => a.file_type === "contract")} emptyText="등록된 파일이 없습니다." />
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">견적서 첨부</div>
                    <div className="table_data attach">
                      <FileLinks items={detail.contractAttachments.filter((a) => a.file_type === "estimate")} emptyText="등록된 파일이 없습니다." />
                    </div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">주 담당자</div>
                    <div className="table_data">{detail.contract.primary_contact_name ?? ""}</div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">부 담당자</div>
                    <div className="table_data">{detail.contract.secondary_contact_name ?? ""}</div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">업무 비고</div>
                    <div className="table_data">{detail.contract.work_note ?? ""}</div>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {detail && (
          <div className={styles.footer}>
            <div className="btn_wrap">
              <button type="button" className="btn btn_lg primary" onClick={handleEdit}>
                수정
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
