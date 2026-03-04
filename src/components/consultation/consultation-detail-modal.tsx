"use client";

import { X } from "lucide-react";
import type { ConsultationDetail } from "@/app/actions/consultation";
import styles from "./consultation-detail-modal.module.css";

type ConsultationDetailModalProps = {
  detail: ConsultationDetail | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatAmount(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  const digits = String(value).replace(/\D/g, "");
  if (digits === "") return "-";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function ConsultationDetailModal({ detail, isOpen, onClose, isLoading }: ConsultationDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>상담 상세조회</h3>
          <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="닫기"></button>
        </div>

        <div className={`${styles.body} scroll`}>
          {isLoading || !detail ? (
            <div className={styles.loading}>상담 정보를 불러오는 중...</div>
          ) : (
            <div className={styles.tableGroup}>
              {/* 기본 정보 */}
              <div className={styles.tableItem}>
                <h2 className={styles.tableTitle}>기본 정보</h2>
                <ul className={styles.tableRow}>
                  <li className={styles.rowGroup}>
                    <div className={styles.tableHead}>상호(법인명)</div>
                    <div className={styles.tableData}>{detail.company_name || "-"}</div>
                  </li>
                  <li className={styles.rowGroup}>
                    <div className={styles.tableHead}>업종</div>
                    <div className={styles.tableData}>{detail.industry || "-"}</div>
                  </li>
                </ul>
                <ul className={styles.tableRow}>
                  <li className={styles.rowGroup}>
                    <div className={styles.tableHead}>브랜드</div>
                    <div className={styles.tableData}>{detail.brand || "-"}</div>
                  </li>
                  <li className={styles.rowGroup}>
                    <div className={styles.tableHead}>예산</div>
                    <div className={styles.tableData}>{detail.budget ? formatAmount(detail.budget) : "-"}</div>
                  </li>
                </ul>
              </div>

              {/* 담당자 정보 */}
              <div className={styles.tableItem}>
                <h2 className={styles.tableTitle}>담당자 정보</h2>
                {detail.contacts.length > 0 ? (
                  detail.contacts.map((contact, index) => (
                    <div key={index} className={styles.contactBlock}>
                      <h3 className={styles.tableTitleSub}>담당자 {index + 1}</h3>
                      <ul className={styles.tableRow}>
                        <li className={styles.rowGroup}>
                          <div className={styles.tableHead}>이름</div>
                          <div className={styles.tableData}>{contact.name || "-"}</div>
                        </li>
                        <li className={styles.rowGroup}>
                          <div className={styles.tableHead}>연락처</div>
                          <div className={styles.tableData}>{contact.phone || "-"}</div>
                        </li>
                      </ul>
                      <ul className={styles.tableRow}>
                        <li className={styles.rowGroup}>
                          <div className={styles.tableHead}>이메일</div>
                          <div className={styles.tableData}>{contact.email || "-"}</div>
                        </li>
                        <li className={styles.rowGroup}>
                          <div className={styles.tableHead}>비고</div>
                          <div className={styles.tableData}>{contact.note || "-"}</div>
                        </li>
                      </ul>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyText}>등록된 담당자가 없습니다.</p>
                )}
              </div>

              {/* 사이트 정보 */}
              <div className={styles.tableItem}>
                <h2 className={styles.tableTitle}>사이트 정보</h2>
                {detail.sites.length > 0 ? (
                  <div className={styles.siteTableWrap}>
                    <table className={styles.siteTable}>
                      <thead>
                        <tr>
                          <th>브랜드</th>
                          <th>도메인</th>
                          <th>솔루션</th>
                          <th>유형</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.sites.map((site, index) => (
                          <tr key={index}>
                            <td>{site.brand || "-"}</td>
                            <td>{site.domain || "-"}</td>
                            <td>{site.solution || "-"}</td>
                            <td>{site.type || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={styles.emptyText}>등록된 사이트가 없습니다.</p>
                )}
              </div>

              {/* 비고 */}
              <div className={styles.tableItem}>
                <h2 className={styles.tableTitle}>비고</h2>
                <div>
                  <div className={styles.text_box}>{detail.general_remarks || "-"}</div>
                </div>
              </div>

              {/* 상담 내용 */}
              <div className={styles.tableItem}>
                <h2 className={styles.tableTitle}>상담 내용</h2>
                <ul className={styles.tableRow}>
                  <li className={styles.rowGroup}>
                    <div className={styles.tableHead}>구분</div>
                    <div className={styles.tableData}>{detail.category_names?.length ? detail.category_names.join(", ") : "-"}</div>
                  </li>
                </ul>
                <ul className={styles.tableRow}>
                  <li className={styles.rowGroup}>
                    <div className={styles.tableHead}>상담일자</div>
                    <div className={styles.tableData}>{formatDate(detail.consultation_date)}</div>
                  </li>
                  <li className={styles.rowGroup}>
                    <div className={styles.tableHead}>등록일</div>
                    <div className={styles.tableData}>{formatDate(detail.created_at)}</div>
                  </li>
                </ul>
                <ul className={styles.tableRow}>
                  <li className={styles.rowGroupFull}>
                    <div className={styles.tableHead}>상담내용</div>
                    <div className={styles.tableDataContent}>{detail.consultation_content || "-"}</div>
                  </li>
                </ul>
                {detail.attachments.length > 0 && (
                  <ul className={styles.tableRow}>
                    <li className={styles.rowGroupFull}>
                      <div className={styles.tableHead}>첨부파일</div>
                      <div className={styles.tableData}>
                        <ul className={styles.attachList}>
                          {detail.attachments.map((a, i) => (
                            <li key={i}>
                              <a href={a.file_url} target="_blank" rel="noopener noreferrer" className={styles.attachLink}>
                                {a.file_name || "파일"}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={onClose} className="btn btn_lg normal">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
