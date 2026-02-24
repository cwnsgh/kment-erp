"use client";

import Link from "next/link";
import type { ContractDashboardItem } from "@/components/client/client-dashboard-with-tabs";
import styles from "./client-dashboard-with-tabs.module.css";

type ClientDashboardContractProps = {
  contracts: ContractDashboardItem[];
  slideIndex: number;
  onSlideChange: (index: number) => void;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getApprovalLabel(status: string) {
  if (status === "pending") return "승인요청";
  if (status === "approved") return "승인완료";
  if (status === "rejected") return "승인반려";
  if (status === "deleted") return "취소됨";
  if (status === "in_progress") return "작업중";
  if (status === "completed") return "작업완료";
  return "승인완료";
}

function getApprovalClass(status: string) {
  if (status === "pending") return styles.approvalRequest;
  if (status === "approved") return styles.approvalComplete;
  if (status === "rejected") return styles.approvalRefusal;
  if (status === "deleted") return styles.approvalComplete;
  if (status === "in_progress") return styles.workOngoing;
  if (status === "completed") return styles.workComplete;
  return styles.approvalComplete;
}

function getWorkStatusLabel(status: string) {
  if (status === "in_progress") return "작업중";
  if (status === "completed") return "작업완료";
  if (status === "approved") return "작업대기";
  if (status === "pending") return "승인요청";
  if (status === "rejected") return "승인반려";
  if (status === "deleted") return "취소됨";
  return status;
}

function getWorkStatusClass(status: string) {
  if (status === "in_progress") return styles.workOngoing;
  if (status === "completed") return styles.workComplete;
  if (status === "approved") return styles.workWaiting;
  if (status === "pending") return styles.approvalRequest;
  if (status === "rejected") return styles.approvalRefusal;
  if (status === "deleted") return styles.approvalComplete;
  return "";
}

export function ClientDashboardContract({
  contracts,
  slideIndex,
  onSlideChange,
}: ClientDashboardContractProps) {
  const totalSlides = contracts.length;
  const currentContract = contracts[slideIndex] ?? null;
  const goPrev = () => onSlideChange(slideIndex <= 0 ? slideIndex : slideIndex - 1);
  const goNext = () => onSlideChange(slideIndex >= totalSlides - 1 ? slideIndex : slideIndex + 1);

  if (contracts.length === 0) {
    return (
      <div className={styles.contractEmpty}>
        등록된 계약이 없습니다.
      </div>
    );
  }

  return (
    <div className={styles.slideWrap}>
      <div className={styles.slideControl}>
        <div className={styles.slidePagination}>
          <span className={styles.slidePaginationCurrent}>
            {String(slideIndex + 1).padStart(2, "0")}
          </span>
          {" / "}
          {String(totalSlides).padStart(2, "0")}
        </div>
        <div className={styles.slideArrows}>
          <button
            type="button"
            className={`${styles.slideArrow} ${styles.slideArrowPrev}`}
            onClick={goPrev}
            disabled={slideIndex <= 0}
            aria-label="이전"
          >
            <img src="/images/arrow_icon.svg" alt="" />
          </button>
          <button
            type="button"
            className={styles.slideArrow}
            onClick={goNext}
            disabled={slideIndex >= totalSlides - 1}
            aria-label="다음"
          >
            <img src="/images/arrow_icon.svg" alt="" />
          </button>
        </div>
      </div>

      {currentContract && (
        <>
          <div className={`${styles.whiteBox} ${styles.typeBoxC}`}>
            <h2 className={styles.boxTitle}>
              {currentContract.contract_name}
              {currentContract.brand_name ? ` (${currentContract.brand_name})` : ""}
            </h2>
            <p className={styles.typePeriod}>
              * 안내된 완료일은 예정 일정으로, 프로젝트 진행 상황에 따라 일부 변동될 수 있습니다.
            </p>
            <div className={styles.typeContentC}>
              <div>
                <p className={styles.typeHead}>시안 완료 예정일</p>
                <p className={styles.typeData}>{formatDate(currentContract.draft_due_date)}</p>
              </div>
              <div>
                <p className={styles.typeHead}>데모 완료 예정일</p>
                <p className={styles.typeData}>{formatDate(currentContract.demo_due_date)}</p>
              </div>
              <div>
                <p className={styles.typeHead}>최종 완료일</p>
                <p className={styles.typeData}>{formatDate(currentContract.final_completion_date)}</p>
              </div>
              <div>
                <p className={styles.typeHead}>오픈 예정일</p>
                <p className={styles.typeData}>{formatDate(currentContract.open_due_date)}</p>
              </div>
              {currentContract.work_contents.map((wc) => (
                <div key={wc.id}>
                  <p className={styles.typeHead}>{wc.work_content_name}</p>
                  <p className={styles.typeData}>
                    <span className={styles.typeDataNow}>{wc.modification_count}회</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.flexBox}>
            <div className={`${styles.whiteBox} ${styles.leftBox}`}>
              <h2 className={styles.boxTitle}>승인 현황</h2>
              <Link href="/client/approvals" className={styles.mainBtn}>
                <img src="/images/arrow_icon2.svg" alt="" width={10} height={10} />
              </Link>
              <div className={styles.approvalBox}>
                <div>
                  <span>승인요청</span>
                  <p>
                    {currentContract.work_requests.filter((r) => r.status === "pending").length}건
                  </p>
                </div>
                <div>
                  <span>승인반려</span>
                  <p>
                    {currentContract.work_requests.filter((r) => r.status === "rejected").length}건
                  </p>
                </div>
                <div>
                  <span>승인완료</span>
                  <p>
                    {currentContract.work_requests.filter((r) => r.status === "approved").length}건
                  </p>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <colgroup>
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "auto" }} />
                    <col style={{ width: "18%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>요청날짜</th>
                      <th>작업내용</th>
                      <th>승인여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentContract.work_requests.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: "20px" }}>
                          승인 요청 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      currentContract.work_requests.slice(0, 5).map((r) => (
                        <tr key={r.id}>
                          <td>{formatDate(r.created_at)}</td>
                          <td className={styles.textOverflow}>
                            <p>{r.work_content || "-"}</p>
                          </td>
                          <td>
                            <span className={getApprovalClass(r.status)}>
                              {getApprovalLabel(r.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={`${styles.whiteBox} ${styles.rightBox}`}>
              <h2 className={styles.boxTitle}>작업 현황</h2>
              <Link href="/client/approvals" className={styles.mainBtn}>
                <img src="/images/arrow_icon2.svg" alt="" width={10} height={10} />
              </Link>
              <div className={styles.tableWrap}>
                <table>
                  <colgroup>
                    <col style={{ width: "40%" }} />
                    <col style={{ width: "auto" }} />
                    <col style={{ width: "18%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>작업기간</th>
                      <th>작업내용</th>
                      <th>작업여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentContract.work_requests.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: "20px" }}>
                          작업 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      currentContract.work_requests.slice(0, 5).map((r) => (
                        <tr key={r.id}>
                          <td>
                            {r.work_period
                              ? `${formatDate(r.work_period)} ~ ${formatDate(r.work_period)}`
                              : "-"}
                          </td>
                          <td className={styles.textOverflow}>
                            <p>{r.work_content || "-"}</p>
                          </td>
                          <td>
                            <span className={getWorkStatusClass(r.status)}>
                              {getWorkStatusLabel(r.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
