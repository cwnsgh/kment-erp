"use client";

import { useState, useTransition } from "react";
import { WorkRequest } from "@/app/actions/work-request";
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
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const itemsPerPageOptions = [10, 50, 100, 200];

  const loadData = async (page: number, filter: typeof statusFilter, limit: number) => {
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getFullYear()).slice(-2)}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
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
      pending: "approval_request",
      approved: "approval_complete",
      rejected: "approval_refusal",
      in_progress: "work_ongoing",
      completed: "work_complete",
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

  // 필터링된 작업만 표시 (approved, in_progress, completed)
  const filteredRequests = workRequests.filter(
    (r) => r.status === "approved" || r.status === "in_progress" || r.status === "completed"
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
              <span className={styles.companyName}>{clientName || "(주)케이먼트코퍼레이션"}</span> 업무 내역{" "}
              <span className={styles.workCount}>({filteredRequests.length}건)</span>
            </h2>

            <div className={styles.tableItem}>
              <ul className={styles.tableRow}>
                <li className={styles.rowGroup}>
                  <div className={styles.tableHead}>진행상황</div>
                  <div className={styles.tableData}>
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
                  총 <span>{filteredRequests.length}건</span>의 작업 현황이 조회되었습니다.
                </p>
              </div>
              <div className={styles.topBtnGroup}>
                <div className={`${styles.excelBtn} btn btn_md normal`}>
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
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                        작업 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request, index) => (
                      <tr key={request.id}>
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
                onClick={() => currentPage > 1 && loadData(1, statusFilter, itemsPerPage)}
              ></li>
              <li
                className={`${styles.page} ${styles.prev} ${
                  currentPage === 1 ? styles.disabled : ""
                }`}
                onClick={() =>
                  currentPage > 1 && loadData(currentPage - 1, statusFilter, itemsPerPage)
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
                    onClick={() => loadData(pageNum, statusFilter, itemsPerPage)}
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
                  currentPage < totalPages && loadData(totalPages, statusFilter, itemsPerPage)
                }
              ></li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
