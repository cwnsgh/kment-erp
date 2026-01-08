"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { WorkRequest } from "@/app/actions/work-request";
import styles from "./client-dashboard.module.css";

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
};

type ClientDashboardProps = {
  clientName: string;
  managedClient: ManagedClient | null;
  workRequests: WorkRequest[];
  unreadNotificationCount?: number;
};

export function ClientDashboard({
  clientName,
  managedClient,
  workRequests,
  unreadNotificationCount = 0,
}: ClientDashboardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatProductType1 = (type: "deduct" | "maintenance") => {
    return type === "deduct" ? "금액차감형" : "유지보수형";
  };

  const formatProductType2 = (type1: string, type2: string) => {
    if (type1 === "deduct") {
      const monthMap: Record<string, string> = {
        "3m": "3개월",
        "6m": "6개월",
        "9m": "9개월",
        "12m": "12개월",
      };
      return monthMap[type2] || type2;
    } else {
      const typeMap: Record<string, string> = {
        standard: "스탠다드",
        premium: "프리미엄",
      };
      return typeMap[type2] || type2;
    }
  };

  // 승인 현황 통계 계산
  const approvalStats = {
    pending: workRequests.filter((r) => r.status === "pending").length,
    rejected: workRequests.filter((r) => r.status === "rejected").length,
    approved: workRequests.filter((r) => r.status === "approved").length,
  };

  // 최근 승인 현황 (최대 3개)
  const recentApprovals = workRequests.slice(0, 3);

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

  // 관리 상품이 없을 때
  if (!managedClient) {
    return (
      <section className={`customer_main main page_section`}>
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
        <div className="white_box type_box type_n">
          <div>
            <p>등록된 관리 상품이 없습니다.</p>
          </div>
        </div>
      </section>
    );
  }

  // 금액차감형
  if (managedClient.product_type1 === "deduct") {
    return (
      <section className="customer_main main page_section">
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
        <div className="white_box type_box">
          <h2 className="box_title font_b">
            {formatProductType1(managedClient.product_type1)} (
            {formatProductType2(
              managedClient.product_type1,
              managedClient.product_type2
            )}
            )
          </h2>
          <h3 className="type_period">
            {formatDate(managedClient.start_date)} ~{" "}
            {formatDate(managedClient.end_date)}
          </h3>
          <div className="type_content">
            <div>
              <p className="type_head">총 금액</p>
              <p className="type_data font_b">
                {managedClient.total_amount
                  ? managedClient.total_amount.toLocaleString()
                  : "-"}
              </p>
            </div>
            <div>
              <p className="type_head">차감 금액</p>
              <p className="type_data font_b">-</p>
            </div>
            <div>
              <p className="type_head">잔여 금액</p>
              <p className="type_data font_b">-</p>
            </div>
          </div>
        </div>
        <div className="flex_box">
          <div className="white_box left_box">
            <h2 className="box_title">승인 현황</h2>
            <div className={styles.mainBtn}>
              <Link href="/client/approvals">
                <img
                  src="/images/arrow_icon2.svg"
                  alt=""
                  className={styles.arrowIcon}
                  width={10}
                  height={10}
                  style={{
                    width: "10px",
                    height: "10px",
                    maxWidth: "10px",
                    maxHeight: "10px",
                    minWidth: "10px",
                    minHeight: "10px",
                    objectFit: "contain",
                  }}
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
            <div className={styles.mainBtn}>
              <Link href="/client/tasks">
                <img
                  src="/images/arrow_icon2.svg"
                  alt="작업 현황 보기"
                  className={styles.arrowIcon}
                  width={10}
                  height={10}
                  style={{
                    width: "10px",
                    height: "10px",
                    maxWidth: "10px",
                    maxHeight: "10px",
                    minWidth: "10px",
                    minHeight: "10px",
                    objectFit: "contain",
                  }}
                />
              </Link>
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
                    <th>작업기간</th>
                    <th>작업내용</th>
                    <th>작업여부</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      작업 내역이 없습니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 유지보수형
  return (
    <section className="customer_main main page_section">
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
          {formatProductType1(managedClient.product_type1)} (
          {formatProductType2(
            managedClient.product_type1,
            managedClient.product_type2
          )}
          )
        </h2>
        <h3 className={styles.typePeriod}>
          {formatDate(managedClient.start_date)} ~{" "}
          {formatDate(managedClient.end_date)}
        </h3>
        <div className={styles.typeContent}>
          <div>
            <p className={styles.typeHead}>영역 텍스트 수정</p>
            <p className="type_data">
              <span className="font_b">
                {managedClient.detail_text_edit_count || 0}회
              </span>{" "}
              / <span>-회</span>
            </p>
          </div>
          <div>
            <p className={styles.typeHead}>코딩 수정</p>
            <p className="type_data">
              <span className="font_b">
                {managedClient.detail_coding_edit_count || 0}회
              </span>{" "}
              / <span>-회</span>
            </p>
          </div>
          <div>
            <p className={styles.typeHead}>기존 결과물 이미지 수정</p>
            <p className="type_data">
              <span className="font_b">
                {managedClient.detail_image_edit_count || 0}회
              </span>{" "}
              / <span>-회</span>
            </p>
          </div>
          <div>
            <p className={styles.typeHead}>팝업 디자인</p>
            <p className="type_data">
              <span className="font_b">
                {managedClient.detail_popup_design_count || 0}회
              </span>{" "}
              / <span>-회</span>
            </p>
          </div>
          {managedClient.product_type2 === "premium" && (
            <div>
              <p className={styles.typeHead}>배너 디자인</p>
              <p className="type_data">
                <span className="font_b">
                  {managedClient.detail_banner_design_count || 0}회
                </span>{" "}
                / <span>-회</span>
              </p>
            </div>
          )}
        </div>
      </div>
      <div className={styles.flexBox}>
        <div className="white_box left_box">
          <h2 className="box_title">승인 현황</h2>
          <div className={styles.mainBtn}>
            <Link href="/client/approvals">
              <img
                src="/images/arrow_icon2.svg"
                alt=""
                className={styles.arrowIcon}
                width={10}
                height={10}
                style={{
                  width: "10px",
                  height: "10px",
                  maxWidth: "10px",
                  maxHeight: "10px",
                  minWidth: "10px",
                  minHeight: "10px",
                  objectFit: "contain",
                }}
              />
            </Link>
          </div>
          <div className={styles.approvalBox}>
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
          <div className={styles.tableWrap}>
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
        <div className="white_box right_box">
          <h2 className="box_title">작업 현황</h2>
          <div className={styles.mainBtn}>
            <Link href="/client/tasks">
              <img
                src="/images/arrow_icon2.svg"
                alt="작업 현황 보기"
                className={styles.arrowIcon}
                width={10}
                height={10}
                style={{
                  width: "10px",
                  height: "10px",
                  maxWidth: "10px",
                  maxHeight: "10px",
                  minWidth: "10px",
                  minHeight: "10px",
                  objectFit: "contain",
                }}
              />
            </Link>
          </div>
          <div className={styles.tableWrap}>
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
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    작업 내역이 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
