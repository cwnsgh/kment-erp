"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStaffById, type StaffDetail } from "@/app/actions/staff";
import { formatEmploymentStatus, formatPhoneDisplay } from "@/lib/staff-utils";
import styles from "./staff-detail-modal.module.css";

function formatDateDot(dateString: string | null): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

type StaffDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  staffId: string | null;
  /** 'manage'면 기본 정보 아래에 관리자 메모 섹션 표시 (권한 있을 때만 getStaffById에서 내려옴) */
  variant?: "list" | "manage";
};

export function StaffDetailModal({ isOpen, onClose, staffId, variant = "list" }: StaffDetailModalProps) {
  const [detail, setDetail] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !staffId) {
      setDetail(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getStaffById(staffId)
      .then((res) => {
        if (res.success && res.data) setDetail(res.data);
        else setError(res.error ?? "조회 실패");
      })
      .finally(() => setLoading(false));
  }, [isOpen, staffId]);

  if (!isOpen) return null;

  const statusClass = (status: string | null) => {
    if (!status) return "";
    if (status === "employed") return styles.statusEmployed;
    if (status === "left") return styles.statusLeft;
    return styles.statusLeave;
  };

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-detail-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 id="staff-detail-modal-title">직원 상세조회</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <div className={styles.body}>
          {loading && <p className={styles.loading}>로딩 중...</p>}
          {error && <p className={styles.error}>{error}</p>}
          {!loading && !error && detail && (
            <>
              <h3 className={styles.sectionTitle}>기본 정보</h3>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <th>이름</th>
                    <td>{detail.name || "-"}</td>
                  </tr>
                  <tr>
                    <th>직급</th>
                    <td>{detail.role_name ?? "-"}</td>
                  </tr>
                  <tr>
                    <th>담당 업무</th>
                    <td>{detail.job_type ?? "-"}</td>
                  </tr>
                  <tr>
                    <th>휴대폰 번호</th>
                    <td>{detail.phone ? formatPhoneDisplay(detail.phone) : "-"}</td>
                  </tr>
                  <tr>
                    <th>이메일</th>
                    <td>{detail.contact_email ?? "-"}</td>
                  </tr>
                  <tr>
                    <th>생년월일</th>
                    <td>
                      {detail.birth_date ? `${formatDateDot(detail.birth_date)} (양력)` : "-"}
                    </td>
                  </tr>
                  <tr>
                    <th>입사일</th>
                    <td>{formatDateDot(detail.join_date)}</td>
                  </tr>
                  <tr>
                    <th>퇴사일</th>
                    <td>{formatDateDot(detail.leave_date)}</td>
                  </tr>
                  <tr>
                    <th>재직 상태</th>
                    <td>
                      <span className={statusClass(detail.employment_status)}>
                        {formatEmploymentStatus(detail.employment_status)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              {variant === "manage" && (
                <div className={styles.adminMemoSection}>
                  <h3 className={styles.sectionTitle}>관리자 메모</h3>
                  <div className={styles.adminMemoContent}>
                    {detail.admin_memo?.trim() || "관리자인 수정할 수 있는 페이지\n하단 관리자 메모에 특이사항 입력 후 저장할 수 있습니다."}
                  </div>
                </div>
              )}
              <div className={styles.footer}>
                <Link href={`/staff/${detail.id}/edit`} className="btn btn_lg primary" onClick={onClose}>
                  수정
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
