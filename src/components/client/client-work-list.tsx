"use client";

import { useState, useTransition } from "react";
import {
  WorkRequest,
  getWorkRequestDetailForClient,
} from "@/app/actions/work-request";
import { buildExcelFilename, downloadExcel } from "@/lib/excel-download";
import styles from "./client-work-list.module.css";

type WorkRequestWithEmployee = WorkRequest & {
  employee_name?: string | null;
};

type ClientWorkListProps = {
  initialWorkRequests: WorkRequest[];
  initialTotalCount: number;
  clientName?: string;
};

export function ClientWorkList({
  initialWorkRequests,
  initialTotalCount,
  clientName = "",
}: ClientWorkListProps) {
  const [workRequests, setWorkRequests] = useState<WorkRequestWithEmployee[]>(
    initialWorkRequests as WorkRequestWithEmployee[]
  );
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "in_progress" | "completed"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const itemsPerPageOptions = [10, 50, 100, 200];
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    workRequest:
      | (WorkRequest & {
          employee_name?: string | null;
          client_name?: string | null;
          approved_by_client_name?: string | null;
          approved_by_signature_url?: string | null;
          approval_deducted_amount?: number | null;
          approval_remaining_amount?: number | null;
          approval_text_edit_count?: number | null;
          approval_coding_edit_count?: number | null;
          approval_image_edit_count?: number | null;
          approval_popup_design_count?: number | null;
          approval_banner_design_count?: number | null;
          cost?: number | null;
          approved_at?: string | null;
          count?: number | null;
          managed_client?: {
            productType1: string;
            productType2: string;
            totalAmount: number | null;
            startDate: string | null;
            endDate: string | null;
            status: string;
            detailTextEditCount: number;
            detailCodingEditCount: number;
            detailImageEditCount: number;
            detailPopupDesignCount: number;
            detailBannerDesignCount: number;
          } | null;
        })
      | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    workRequest: null,
    isLoading: false,
  });

  const loadData = async (
    page: number,
    filter: typeof statusFilter,
    limit: number
  ) => {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/client/work-requests?statusFilter=${filter}&page=${page}&limit=${limit}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.totalCount !== undefined) {
            setWorkRequests(data.data);
            setTotalCount(data.totalCount);
            setCurrentPage(page);
          }
        }
      } catch (error) {
        console.error("업무 목록 조회 오류:", error);
      }
    });
  };

  const handleFilterChange = (filter: typeof statusFilter) => {
    setStatusFilter(filter);
    loadData(1, filter, itemsPerPage);
  };

  const handleSearch = () => {
    loadData(1, statusFilter, itemsPerPage);
  };

  const handleReset = () => {
    setStatusFilter("all");
    loadData(1, "all", itemsPerPage);
  };

  const handleExcelDownload = () => {
    const params = new URLSearchParams();
    params.set("statusFilter", statusFilter);

    downloadExcel(
      `/api/client/work-requests/export?${params.toString()}`,
      buildExcelFilename("작업현황-목록")
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getFullYear()).slice(-2)}.${String(
      date.getMonth() + 1
    ).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatWorkPeriod = (request: WorkRequestWithEmployee) => {
    // 작업기간: 요청날짜 ~ 완료날짜 또는 현재
    const startDate = formatDate(request.created_at);
    if (request.status === "completed" && request.updated_at) {
      const endDate = formatDate(request.updated_at);
      return `${startDate} ~ ${endDate}`;
    }
    return `${startDate} ~ `;
  };

  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      pending: styles.approvalRequest,
      approved: styles.approvalComplete,
      rejected: styles.approvalRefusal,
      in_progress: styles.workOngoing,
      completed: styles.workComplete,
    };
    return classMap[status] || "";
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "승인요청",
      approved: "승인완료",
      rejected: "승인반려",
      in_progress: "작업중",
      completed: "작업완료",
    };
    return statusMap[status] || status;
  };

  // 업무 상세 모달 열기
  const handleOpenDetailModal = async (workRequestId: string) => {
    setDetailModal({
      isOpen: true,
      workRequest: null,
      isLoading: true,
    });

    try {
      const result = await getWorkRequestDetailForClient(workRequestId);
      if (result.success && result.data) {
        setDetailModal({
          isOpen: true,
          workRequest: result.data as any,
          isLoading: false,
        });
      } else {
        alert(`업무 상세 정보를 불러올 수 없습니다: ${result.error}`);
        setDetailModal({
          isOpen: false,
          workRequest: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("업무 상세 정보 조회 오류:", error);
      alert("업무 상세 정보를 불러오는 중 오류가 발생했습니다.");
      setDetailModal({
        isOpen: false,
        workRequest: null,
        isLoading: false,
      });
    }
  };

  // 업무 상세 모달 닫기
  const handleCloseDetailModal = () => {
    setDetailModal({
      isOpen: false,
      workRequest: null,
      isLoading: false,
    });
  };

  // 날짜 포맷 (모달용)
  const formatDateForModal = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  // 작업기간 포맷 (모달용)
  const formatWorkPeriodForModal = (
    startDate: string | null | undefined,
    endDate: string | null | undefined
  ) => {
    if (!startDate && !endDate) return "-";
    const start = formatDateForModal(startDate);
    const end = formatDateForModal(endDate);
    return `${start} ~ ${end}`;
  };

  // 필터링된 작업만 표시 (approved, in_progress, completed)
  const filteredRequests = workRequests.filter(
    (r) =>
      r.status === "approved" ||
      r.status === "in_progress" ||
      r.status === "completed"
  );

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  return (
    <section className={`${styles.customerWorkList} page_section`}>
      <div className="page_title">
        <h1>작업 현황</h1>
      </div>

      <div className="white_box">
        <div className={styles.boxInner}>
          <div className={`${styles.searchBox} table_group`}>
            <h2 className={styles.pageSubTitle}>
              <span className={styles.companyName}>
                {clientName || "(주)케이먼트코퍼레이션"}
              </span>{" "}
              업무 내역{" "}
              <span className={styles.workCount}>
                ({filteredRequests.length}건)
              </span>
            </h2>

            <div className={styles.searchTableItem}>
              <ul className={styles.searchTableRow}>
                <li className={styles.searchRowGroup}>
                  <div className={styles.searchTableHead}>진행상황</div>
                  <div className={styles.searchTableData}>
                    <input
                      type="radio"
                      id="search_type_all"
                      name="search_type1"
                      value="all"
                      checked={statusFilter === "all"}
                      onChange={() => setStatusFilter("all")}
                    />
                    <label htmlFor="search_type_all">전체</label>

                    <input
                      type="radio"
                      id="search_type_ongoing"
                      name="search_type1"
                      value="ongoing"
                      checked={statusFilter === "in_progress"}
                      onChange={() => setStatusFilter("in_progress")}
                    />
                    <label htmlFor="search_type_ongoing">작업중</label>

                    <input
                      type="radio"
                      id="search_type_complete"
                      name="search_type1"
                      value="complete"
                      checked={statusFilter === "completed"}
                      onChange={() => setStatusFilter("completed")}
                    />
                    <label htmlFor="search_type_complete">작업완료</label>
                  </div>
                </li>
              </ul>
            </div>

            <div className={styles.btnWrap}>
              <div className={`btn btn_lg primary`} onClick={handleSearch}>
                검색
              </div>
              <div className={`btn btn_lg normal`} onClick={handleReset}>
                초기화
              </div>
            </div>
          </div>

          <div className={styles.listTable}>
            <div className={styles.tableTop}>
              <div className={styles.topTotal}>
                <p>
                  총 <span>{filteredRequests.length}건</span>의 작업 현황이
                  조회되었습니다.
                </p>
              </div>
              <div className={styles.topBtnGroup}>
                <div
                  className={`${styles.excelBtn} btn btn_md normal`}
                  onClick={handleExcelDownload}
                >
                  엑셀다운로드
                </div>
                <select
                  className={styles.viewSelect}
                  value={itemsPerPage}
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value, 10);
                    setItemsPerPage(newLimit);
                    loadData(1, statusFilter, newLimit);
                  }}
                >
                  {itemsPerPageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}개씩 보기
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table>
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "auto" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>브랜드명</th>
                    <th>담당자</th>
                    <th>작업기간</th>
                    <th>작업내용</th>
                    <th>작업여부</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ textAlign: "center", padding: "40px" }}
                      >
                        작업 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request, index) => (
                      <tr
                        key={request.id}
                        onClick={() => handleOpenDetailModal(request.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>{request.brand_name}</td>
                        <td>{request.employee_name || "-"}</td>
                        <td>{formatWorkPeriod(request)}</td>
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
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <ul>
              <li
                className={`${styles.page} ${styles.first} ${
                  currentPage === 1 ? styles.disabled : ""
                }`}
                onClick={() =>
                  currentPage > 1 && loadData(1, statusFilter, itemsPerPage)
                }
              ></li>
              <li
                className={`${styles.page} ${styles.prev} ${
                  currentPage === 1 ? styles.disabled : ""
                }`}
                onClick={() =>
                  currentPage > 1 &&
                  loadData(currentPage - 1, statusFilter, itemsPerPage)
                }
              ></li>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <li
                    key={pageNum}
                    className={`${styles.page} ${
                      currentPage === pageNum ? styles.active : ""
                    }`}
                    onClick={() =>
                      loadData(pageNum, statusFilter, itemsPerPage)
                    }
                  >
                    {pageNum}
                  </li>
                );
              })}

              <li
                className={`${styles.page} ${styles.next} ${
                  currentPage === totalPages ? styles.disabled : ""
                }`}
                onClick={() =>
                  currentPage < totalPages &&
                  loadData(currentPage + 1, statusFilter, itemsPerPage)
                }
              ></li>
              <li
                className={`${styles.page} ${styles.last} ${
                  currentPage === totalPages ? styles.disabled : ""
                }`}
                onClick={() =>
                  currentPage < totalPages &&
                  loadData(totalPages, statusFilter, itemsPerPage)
                }
              ></li>
            </ul>
          </div>
        )}
      </div>

      {/* 업무 상세 모달 */}
      {detailModal.isOpen && (
        <div
          className={styles.detailModalOverlay}
          onClick={handleCloseDetailModal}
        >
          <div
            className={styles.detailModalInner}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailModalHeader}>
              <h3>관리 업무 상세조회</h3>
              <button
                type="button"
                className={styles.detailModalClose}
                onClick={handleCloseDetailModal}
              >
                ×
              </button>
            </div>

            <div className={`${styles.detailModalBody} ${styles.scroll}`}>
              {detailModal.isLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  로딩 중...
                </div>
              ) : detailModal.workRequest ? (
                <div className={styles.tableGroup}>
                  {/* 관리 상품 정보 */}
                  {detailModal.workRequest.managed_client && (
                    <div className={styles.tableItem}>
                      <h2 className={styles.tableTitle}>관리 상품 정보</h2>
                      <ul className={styles.tableRow}>
                        <li className={styles.rowGroup}>
                          <div className={styles.tableHead}>
                            관리 상품 유형1
                          </div>
                          <div className={styles.tableData}>
                            {detailModal.workRequest.managed_client
                              .productType1 === "deduct"
                              ? "금액차감형"
                              : "유지보수형"}
                          </div>
                        </li>
                        <li className={styles.rowGroup}>
                          <div className={styles.tableHead}>
                            관리 상품 유형2
                          </div>
                          <div className={styles.tableData}>
                            {detailModal.workRequest.managed_client
                              .productType1 === "deduct"
                              ? detailModal.workRequest.managed_client
                                  .productType2 === "3m"
                                ? "3개월"
                                : detailModal.workRequest.managed_client
                                    .productType2 === "6m"
                                ? "6개월"
                                : detailModal.workRequest.managed_client
                                    .productType2 === "9m"
                                ? "9개월"
                                : detailModal.workRequest.managed_client
                                    .productType2 === "12m"
                                ? "12개월"
                                : detailModal.workRequest.managed_client
                                    .productType2
                              : detailModal.workRequest.managed_client
                                  .productType2 === "standard"
                              ? "스탠다드"
                              : detailModal.workRequest.managed_client
                                  .productType2 === "premium"
                              ? "프리미엄"
                              : detailModal.workRequest.managed_client
                                  .productType2}
                          </div>
                        </li>
                      </ul>
                      {/* 금액차감형: 총 금액, 차감 금액, 잔여 금액 */}
                      {detailModal.workRequest.managed_client.productType1 ===
                        "deduct" && (
                        <>
                          <ul className={styles.tableRow}>
                            <li className={styles.rowGroup}>
                              <div className={styles.tableHead}>총 금액</div>
                              <div
                                className={`${styles.tableData} ${styles.fontB}`}
                              >
                                {detailModal.workRequest.managed_client
                                  .totalAmount
                                  ? detailModal.workRequest.managed_client.totalAmount.toLocaleString()
                                  : "-"}
                              </div>
                            </li>
                            <li className={styles.rowGroup}>
                              <div className={styles.tableHead}>차감 금액</div>
                              <div
                                className={`${styles.tableData} ${styles.fontB}`}
                              >
                                {detailModal.workRequest
                                  .approval_deducted_amount !== null &&
                                detailModal.workRequest
                                  .approval_deducted_amount !== undefined
                                  ? detailModal.workRequest.approval_deducted_amount.toLocaleString()
                                  : "-"}
                              </div>
                            </li>
                          </ul>
                          <ul className={styles.tableRow}>
                            <li className={styles.rowGroup}>
                              <div className={styles.tableHead}>잔여 금액</div>
                              <div
                                className={`${styles.tableData} ${styles.fontB}`}
                              >
                                {detailModal.workRequest
                                  .approval_remaining_amount !== null &&
                                detailModal.workRequest
                                  .approval_remaining_amount !== undefined
                                  ? detailModal.workRequest.approval_remaining_amount.toLocaleString()
                                  : "-"}
                              </div>
                            </li>
                          </ul>
                        </>
                      )}

                      {/* 유지보수형: 세부 네영 (잔여) - 승인 시점 정보 */}
                      {detailModal.workRequest.managed_client.productType1 ===
                        "maintenance" && (
                        <ul className={styles.tableRow}>
                          <li className={styles.rowGroup}>
                            <div className={styles.tableHead}>
                              세부 네영 (잔여)
                            </div>
                            <div className={styles.tableData}>
                              <ul className={styles.detailList}>
                                <li>
                                  영역 텍스트 수정
                                  <span>
                                    <b className={styles.fontB}>
                                      {detailModal.workRequest
                                        .approval_text_edit_count !== null &&
                                      detailModal.workRequest
                                        .approval_text_edit_count !== undefined
                                        ? detailModal.workRequest
                                            .approval_text_edit_count
                                        : "-"}
                                    </b>
                                    회
                                  </span>
                                </li>
                                <li>
                                  코딩 수정
                                  <span>
                                    <b className={styles.fontB}>
                                      {detailModal.workRequest
                                        .approval_coding_edit_count !== null &&
                                      detailModal.workRequest
                                        .approval_coding_edit_count !==
                                        undefined
                                        ? detailModal.workRequest
                                            .approval_coding_edit_count
                                        : "-"}
                                    </b>
                                    회
                                  </span>
                                </li>
                                <li>
                                  기존 결과물 이미지 수정
                                  <span>
                                    <b className={styles.fontB}>
                                      {detailModal.workRequest
                                        .approval_image_edit_count !== null &&
                                      detailModal.workRequest
                                        .approval_image_edit_count !== undefined
                                        ? detailModal.workRequest
                                            .approval_image_edit_count
                                        : "-"}
                                    </b>
                                    회
                                  </span>
                                </li>
                                <li>
                                  팝업 디자인
                                  <span>
                                    <b className={styles.fontB}>
                                      {detailModal.workRequest
                                        .approval_popup_design_count !== null &&
                                      detailModal.workRequest
                                        .approval_popup_design_count !==
                                        undefined
                                        ? detailModal.workRequest
                                            .approval_popup_design_count
                                        : "-"}
                                    </b>
                                    회
                                  </span>
                                </li>
                                {detailModal.workRequest.managed_client
                                  .productType2 === "premium" && (
                                  <li>
                                    배너 디자인
                                    <span>
                                      <b className={styles.fontB}>
                                        {detailModal.workRequest
                                          .approval_banner_design_count !==
                                          null &&
                                        detailModal.workRequest
                                          .approval_banner_design_count !==
                                          undefined
                                          ? detailModal.workRequest
                                              .approval_banner_design_count
                                          : "-"}
                                      </b>
                                      회
                                    </span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </li>
                        </ul>
                      )}
                      <ul className={styles.tableRow}>
                        <li className={styles.rowGroup}>
                          <div className={styles.tableHead}>
                            시작일 ~ 종료일
                          </div>
                          <div className={styles.tableData}>
                            {detailModal.workRequest.managed_client.startDate &&
                            detailModal.workRequest.managed_client.endDate
                              ? `${formatWorkPeriodForModal(
                                  detailModal.workRequest.managed_client
                                    .startDate,
                                  detailModal.workRequest.managed_client.endDate
                                )}`
                              : "-"}
                          </div>
                        </li>
                      </ul>
                      <ul className={styles.tableRow}>
                        <li className={styles.rowGroup}>
                          <div className={styles.tableHead}>진행상황</div>
                          <div className={styles.tableData}>
                            <span
                              className={
                                detailModal.workRequest.managed_client
                                  .status === "ongoing"
                                  ? styles.statusOngoing
                                  : detailModal.workRequest.managed_client
                                      .status === "wait"
                                  ? styles.statusWait
                                  : detailModal.workRequest.managed_client
                                      .status === "end"
                                  ? styles.statusEnd
                                  : detailModal.workRequest.managed_client
                                      .status === "unpaid"
                                  ? styles.statusUnpaid
                                  : ""
                              }
                            >
                              {detailModal.workRequest.managed_client.status ===
                              "ongoing"
                                ? "진행"
                                : detailModal.workRequest.managed_client
                                    .status === "wait"
                                ? "대기"
                                : detailModal.workRequest.managed_client
                                    .status === "end"
                                ? "종료"
                                : detailModal.workRequest.managed_client
                                    .status === "unpaid"
                                ? "미납"
                                : detailModal.workRequest.managed_client.status}
                            </span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* 상세 내역 */}
                  <div className={styles.tableItem}>
                    <h2 className={styles.tableTitle}>상세 내역</h2>
                    <ul className={styles.tableRow}>
                      <li className={styles.rowGroup}>
                        <div className={styles.tableHead}>브랜드</div>
                        <div className={styles.tableData}>
                          {detailModal.workRequest.brand_name || "-"}
                        </div>
                      </li>
                    </ul>
                    <ul className={styles.tableRow}>
                      <li className={styles.rowGroup}>
                        <div className={styles.tableHead}>담당자</div>
                        <div className={styles.tableData}>
                          {detailModal.workRequest.employee_name || "-"}
                        </div>
                      </li>
                      <li className={styles.rowGroup}>
                        <div className={styles.tableHead}>작업기간</div>
                        <div className={styles.tableData}>
                          {formatWorkPeriodForModal(
                            detailModal.workRequest.start_date,
                            detailModal.workRequest.end_date
                          )}
                        </div>
                      </li>
                    </ul>
                    {/* 금액차감형: 비용, 승인날짜, 작업여부, 작업내용 */}
                    {detailModal.workRequest.managed_client?.productType1 ===
                      "deduct" && (
                      <>
                        <ul className={styles.tableRow}>
                          <li className={styles.rowGroup}>
                            <div className={styles.tableHead}>비용</div>
                            <div className={styles.tableData}>
                              {detailModal.workRequest.cost
                                ? Number(
                                    detailModal.workRequest.cost
                                  ).toLocaleString()
                                : "-"}
                            </div>
                          </li>
                          <li className={styles.rowGroup}>
                            <div className={styles.tableHead}>승인날짜</div>
                            <div
                              className={`${styles.tableData} ${styles.column}`}
                            >
                              {detailModal.workRequest.approved_at
                                ? formatDateForModal(
                                    detailModal.workRequest.approved_at
                                  )
                                : "-"}
                              {detailModal.workRequest
                                .approved_by_signature_url && (
                                <img
                                  src={
                                    detailModal.workRequest
                                      .approved_by_signature_url
                                  }
                                  alt="서명"
                                  className={styles.signImg}
                                />
                              )}
                            </div>
                          </li>
                        </ul>
                        <ul className={styles.tableRow}>
                          <li className={styles.rowGroup}>
                            <div className={styles.tableHead}>작업여부</div>
                            <div className={styles.tableData}>
                              <span
                                className={getStatusClass(
                                  detailModal.workRequest.status
                                )}
                              >
                                {getStatusLabel(detailModal.workRequest.status)}
                              </span>
                            </div>
                          </li>
                        </ul>
                        <ul className={styles.tableRow}>
                          <li className={styles.rowGroup}>
                            <div className={styles.tableHead}>작업내용</div>
                            <div className={styles.tableData}>
                              {detailModal.workRequest.work_content || "-"}
                            </div>
                          </li>
                        </ul>
                      </>
                    )}

                    {/* 유지보수형: 승인날짜, 작업여부, 작업내용, 횟수 */}
                    {detailModal.workRequest.managed_client?.productType1 ===
                      "maintenance" && (
                      <>
                        <ul className={styles.tableRow}>
                          <li className={styles.rowGroup}>
                            <div className={styles.tableHead}>승인날짜</div>
                            <div
                              className={`${styles.tableData} ${styles.center}`}
                            >
                              {detailModal.workRequest.approved_at
                                ? formatDateForModal(
                                    detailModal.workRequest.approved_at
                                  )
                                : "-"}
                              {detailModal.workRequest
                                .approved_by_signature_url && (
                                <img
                                  src={
                                    detailModal.workRequest
                                      .approved_by_signature_url
                                  }
                                  alt="서명"
                                  className={styles.signImg}
                                />
                              )}
                            </div>
                          </li>
                        </ul>
                        <ul className={styles.tableRow}>
                          <li className={styles.rowGroup}>
                            <div className={styles.tableHead}>작업여부</div>
                            <div className={styles.tableData}>
                              <span
                                className={getStatusClass(
                                  detailModal.workRequest.status
                                )}
                              >
                                {getStatusLabel(detailModal.workRequest.status)}
                              </span>
                            </div>
                          </li>
                        </ul>
                        <ul className={styles.tableRow}>
                          <li className={styles.rowGroup}>
                            <div className={styles.tableHead}>작업내용</div>
                            <div className={styles.tableData}>
                              {detailModal.workRequest.work_content || "-"}
                            </div>
                          </li>
                          <li className={styles.rowGroup}>
                            <div className={styles.tableHead}>횟수</div>
                            <div className={styles.tableData}>
                              {detailModal.workRequest.count || "-"}
                            </div>
                          </li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  업무 정보를 불러올 수 없습니다.
                </div>
              )}
            </div>

            <div className={styles.detailModalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnLg} ${styles.normal}`}
                onClick={handleCloseDetailModal}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
