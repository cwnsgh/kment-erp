"use client";

import Link from "next/link";
import { WorkRequest } from "@/app/actions/work-request";
import styles from "./client-dashboard-maintenance.module.css";

type ManagedClient = {
  id: string;
  product_type1: "deduct" | "maintenance";
  product_type2: string;
  total_amount: number | null;
  payment_status: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  detail_text_edit_count: number | null;
  detail_coding_edit_count: number | null;
  detail_image_edit_count: number | null;
  detail_popup_design_count: number | null;
  detail_banner_design_count: number | null;
  initial_detail_text_edit_count: number | null;
  initial_detail_coding_edit_count: number | null;
  initial_detail_image_edit_count: number | null;
  initial_detail_popup_design_count: number | null;
  initial_detail_banner_design_count: number | null;
};

type ApprovalStats = {
  pending: number;
  approved: number;
  rejected: number;
};

type ClientDashboardMaintenanceProps = {
  clientName: string;
  managedClient: ManagedClient;
  approvalRequests: WorkRequest[]; // 승인 현황 테이블용 (pending, rejected만)
  approvalStats: ApprovalStats; // 승인 통계 (pending, approved, rejected 건수)
  workRequests: WorkRequest[]; // 작업 현황용 (in_progress, completed)
  unreadNotificationCount?: number;
};

export function ClientDashboardMaintenance({
  clientName,
  managedClient,
  approvalRequests,
  approvalStats,
  workRequests,
  unreadNotificationCount = 0,
}: ClientDashboardMaintenanceProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatProductType2 = (type2: string) => {
    const typeMap: Record<string, string> = {
      standard: "스탠다드",
      premium: "프리미엄",
    };
    return typeMap[type2] || type2;
  };

  // 최근 승인 현황 (최대 5개) - pending, rejected만 표시
  const recentApprovals = approvalRequests.slice(0, 5);

  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      pending: "approval_request",
      approved: "approval_complete",
      rejected: "approval_refusal",
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
      approved: "work_waiting",
      in_progress: "work_ongoing",
      completed: "work_complete",
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

  return (
    <section className={`${styles.customerMain} customer_main main page_section`}>
      <div className="page_title">
        <h1>
          <span>{clientName}</span>님, 안녕하세요!
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
      <div className="white_box type_box type_m">
        <h2 className="box_title font_b">
          유지보수형 ({formatProductType2(managedClient.product_type2)})
        </h2>
        <h3 className="type_period">
          {formatDate(managedClient.start_date)} ~{" "}
          {formatDate(managedClient.end_date)}
        </h3>
        <div className="type_content">
          <div>
            <p className="type_head">영역 텍스트 수정</p>
            <p className="type_data">
              <span className="font_b">
                {managedClient.detail_text_edit_count || 0}회
              </span>{" "}
              / <span>{managedClient.initial_detail_text_edit_count || 0}회</span>
            </p>
          </div>
          <div>
            <p className="type_head">코딩 수정</p>
            <p className="type_data">
              <span className="font_b">
                {managedClient.detail_coding_edit_count || 0}회
              </span>{" "}
              / <span>{managedClient.initial_detail_coding_edit_count || 0}회</span>
            </p>
          </div>
          <div>
            <p className="type_head">기존 결과물 이미지 수정</p>
            <p className="type_data">
              <span className="font_b">
                {managedClient.detail_image_edit_count || 0}회
              </span>{" "}
              / <span>{managedClient.initial_detail_image_edit_count || 0}회</span>
            </p>
          </div>
          <div>
            <p className="type_head">팝업 디자인</p>
            <p className="type_data">
              <span className="font_b">
                {managedClient.detail_popup_design_count || 0}회
              </span>{" "}
              / <span>{managedClient.initial_detail_popup_design_count || 0}회</span>
            </p>
          </div>
          {managedClient.product_type2 === "premium" && (
            <div>
              <p className="type_head">배너 디자인</p>
              <p className="type_data">
                <span className="font_b">
                  {managedClient.detail_banner_design_count || 0}회
                </span>{" "}
                / <span>{managedClient.initial_detail_banner_design_count || 0}회</span>
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex_box">
        <div className="white_box left_box">
          <h2 className="box_title">승인 현황</h2>
          <div className="main_btn">
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
          <div className="approval_box">
            <div>
              <span>승인요청</span>
              <p className="font_b">{approvalStats.pending}건</p>
            </div>
            <div>
              <span>승인반려</span>
              <p className="font_b">{approvalStats.rejected}건</p>
            </div>
            <div>
              <span>승인완료</span>
              <p className="font_b">{approvalStats.approved}건</p>
            </div>
          </div>
          <div className="table_wrap">
            <table>
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
                      <td className="text_overflow">
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
        <div className="white_box right_box">
          <h2 className="box_title">작업 현황</h2>
          <div className="main_btn">
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
          <div className="table_wrap">
            <table>
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "auto" }} />
                <col style={{ width: "18%" }} />
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
                          ? `${formatDate(request.start_date)} ~ ${formatDate(request.end_date)}`
                          : "-"}
                      </td>
                      <td className="text_overflow">
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

