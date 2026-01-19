"use client";

import Link from "next/link";
import { WorkRequest } from "@/app/actions/work-request";
import styles from "./client-dashboard-deduct.module.css";

type ManagedClient = {
  id: string;
  product_type1: "deduct" | "maintenance";
  product_type2: string;
  total_amount: number | null;
  payment_status: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
};

type ApprovalStats = {
  pending: number;
  approved: number;
  rejected: number;
};

type ClientDashboardDeductProps = {
  clientName: string;
  managedClient: ManagedClient;
  deductedAmount: number;
  approvalRequests: WorkRequest[]; // 승인 현황 테이블용 (pending, rejected만)
  approvalStats: ApprovalStats; // 승인 통계 (pending, approved, rejected 건수)
  workRequests: WorkRequest[]; // 작업 현황용 (in_progress, completed)
  unreadNotificationCount?: number;
};

export function ClientDashboardDeduct({
  clientName,
  managedClient,
  deductedAmount,
  approvalRequests,
  approvalStats,
  workRequests,
  unreadNotificationCount = 0,
}: ClientDashboardDeductProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatProductType2 = (type2: string) => {
    const monthMap: Record<string, string> = {
      "3m": "3개월",
      "6m": "6개월",
      "9m": "9개월",
      "12m": "12개월",
    };
    return monthMap[type2] || type2;
  };

  // 최근 승인 현황 (최대 5개) - pending, rejected만 표시
  const recentApprovals = approvalRequests.slice(0, 5);

  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      pending: styles.approvalRequest,
      approved: styles.approvalComplete,
      rejected: styles.approvalRefusal,
    };
    return classMap[status] || "";
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "승인요청",
      approved: "승인완료",
      rejected: "승인반려",
    };
    return statusMap[status] || status;
  };

  const getWorkStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      approved: styles.workWaiting,
      in_progress: styles.workOngoing,
      completed: styles.workComplete,
    };
    return classMap[status] || "";
  };

  const getWorkStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      approved: "작업대기",
      in_progress: "작업중",
      completed: "작업완료",
    };
    return statusMap[status] || status;
  };

  const remainingAmount = managedClient.total_amount ?? null;
  const totalAmount =
    remainingAmount !== null ? remainingAmount + deductedAmount : null;

  return (
    <section className={styles.section}>
      <div className={styles.pageTitle}>
        <h1 className={styles.pageTitleHeading}>
          <span className={styles.pageTitleName}>{clientName}</span>님,
          안녕하세요!
        </h1>
        {unreadNotificationCount > 0 && (
          <Link
            href="/client/notifications"
            className={styles.notificationBadge}
          >
            알림 {unreadNotificationCount}건
          </Link>
        )}
      </div>
      <div className={`${styles.whiteBox} ${styles.typeBox}`}>
        <h2 className={`${styles.boxTitle} ${styles.fontBold}`}>
          금액차감형 ({formatProductType2(managedClient.product_type2)})
        </h2>
        <h3 className={styles.typePeriod}>
          {formatDate(managedClient.start_date)} ~{" "}
          {formatDate(managedClient.end_date)}
        </h3>
        <div className={styles.typeContent}>
          <div>
            <p className={styles.typeHead}>총 금액</p>
            <p className={`${styles.typeData} ${styles.fontBold}`}>
              {totalAmount !== null ? totalAmount.toLocaleString() : "-"}
            </p>
          </div>
          <div>
            <p className={styles.typeHead}>차감 금액</p>
            <p className={`${styles.typeData} ${styles.fontBold}`}>
              {deductedAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className={styles.typeHead}>잔여 금액</p>
            <p className={`${styles.typeData} ${styles.fontBold}`}>
              {remainingAmount !== null ? remainingAmount.toLocaleString() : "-"}
            </p>
          </div>
        </div>
      </div>
      <div className={styles.flexBox}>
        <div className={`${styles.whiteBox} ${styles.leftBox}`}>
          <h2 className={styles.boxTitle}>승인 현황</h2>
          <div className={styles.mainBtn}>
            <Link href="/client/approvals">
              <img
                src="/images/arrow_icon2.svg"
                alt=""
                className={styles.arrowIcon}
                width={10}
                height={10}
              />
            </Link>
          </div>
          <div className={styles.approvalBox}>
            <div>
              <span>승인요청</span>
              <p className={styles.fontBold}>{approvalStats.pending}건</p>
            </div>
            <div>
              <span>승인반려</span>
              <p className={styles.fontBold}>{approvalStats.rejected}건</p>
            </div>
            <div>
              <span>승인완료</span>
              <p className={styles.fontBold}>{approvalStats.approved}건</p>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "auto" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>브랜드명</th>
                  <th>요청날짜</th>
                  <th>작업내용</th>
                  <th>승인여부</th>
                </tr>
              </thead>
              <tbody>
                {recentApprovals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      승인 요청 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  recentApprovals.map((request) => (
                    <tr key={request.id}>
                      <td>{request.brand_name}</td>
                      <td>{formatDate(request.created_at)}</td>
                      <td className={styles.textOverflow}>
                        <p>{request.work_content || "-"}</p>
                      </td>
                      <td>
                        <span className={getStatusClass(request.status)}>
                          {getStatusLabel(request.status)}
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
          <div className={styles.mainBtn}>
            <Link href="/client/tasks">
              <img
                src="/images/arrow_icon2.svg"
                alt="작업 현황 보기"
                className={styles.arrowIcon}
                width={10}
                height={10}
              />
            </Link>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "auto" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>브랜드명</th>
                  <th>작업기간</th>
                  <th>작업내용</th>
                  <th>작업여부</th>
                </tr>
              </thead>
              <tbody>
                {workRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      작업 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  workRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.brand_name}</td>
                      <td>
                        {request.start_date && request.end_date
                          ? `${formatDate(request.start_date)} ~ ${formatDate(
                              request.end_date
                            )}`
                          : "-"}
                      </td>
                      <td className={styles.textOverflow}>
                        <p>{request.work_content || "-"}</p>
                      </td>
                      <td>
                        <span className={getWorkStatusClass(request.status)}>
                          {getWorkStatusLabel(request.status)}
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
    </section>
  );
}
