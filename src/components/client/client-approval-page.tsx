"use client";

import { useState, useTransition } from "react";
import { WorkRequest } from "@/app/actions/work-request";
import styles from "./client-approval-page.module.css";

type WorkRequestWithEmployee = WorkRequest & {
  employee_name?: string | null;
};

type ClientApprovalPageProps = {
  initialWorkRequests: WorkRequest[];
  clientName?: string;
};

export function ClientApprovalPage({
  initialWorkRequests,
  clientName = "",
}: ClientApprovalPageProps) {
  const [workRequests, setWorkRequests] = useState<WorkRequestWithEmployee[]>(
    initialWorkRequests as WorkRequestWithEmployee[]
  );
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const itemsPerPageOptions = [10, 50, 100, 200];

  // 승인 현황 통계 계산
  const approvalStats = {
    pending: workRequests.filter((r) => r.status === "pending").length,
    rejected: workRequests.filter((r) => r.status === "rejected").length,
    approved: workRequests.filter((r) => r.status === "approved").length,
  };

  const totalCount = workRequests.length;

  const loadData = async (page: number, limit: number) => {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/client/work-requests?statusFilter=all&page=${page}&limit=${limit}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setWorkRequests(data.data);
            setCurrentPage(page);
          }
        }
      } catch (error) {
        console.error("업무 요청 조회 오류:", error);
      }
    });
  };

  const handleApprove = async (workRequestId: string) => {
    try {
      const response = await fetch(`/api/work-request/${workRequestId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          loadData(currentPage, itemsPerPage);
        } else {
          alert(data.error || "승인 처리에 실패했습니다.");
        }
      } else {
        alert("승인 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 처리 오류:", error);
      alert("승인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (workRequestId: string) => {
    try {
      const response = await fetch(`/api/work-request/${workRequestId}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          loadData(currentPage, itemsPerPage);
        } else {
          alert(data.error || "반려 처리에 실패했습니다.");
        }
      } else {
        alert("반려 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("반려 처리 오류:", error);
      alert("반려 처리 중 오류가 발생했습니다.");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getFullYear()).slice(-2)}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
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

  const paginatedRequests = workRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <section className={`${styles.approvalList} page_section`}>
      <div className="page_title">
        <h1>승인 현황</h1>
      </div>

      <div className="white_box">
        <div className={styles.boxInner}>
          <h2 className={styles.pageSubTitle}>
            <span className={styles.companyName}>{clientName || "(주)케이먼트코퍼레이션"}</span> 승인 내역{" "}
            <span className={styles.workCount}>({totalCount}건)</span>
          </h2>

          <div className={styles.statusBox}>
            <div className={styles.request}>
              <span>승인요청</span>
              <p className="font_b">{approvalStats.pending}건</p>
            </div>
            <div className={styles.refusal}>
              <span>승인반려</span>
              <p className="font_b">{approvalStats.rejected}건</p>
            </div>
            <div className={styles.complete}>
              <span>승인완료</span>
              <p className="font_b">{approvalStats.approved}건</p>
            </div>
          </div>

          <div className={styles.listTable}>
            <div className={styles.tableTop}>
              <div className={styles.topTotal}>
                <p>
                  총 <span>{totalCount}건</span>의 승인현황이 조회되었습니다.
                </p>
              </div>
              <div className={styles.topBtnGroup}>
                <div className={styles.deleteBtn}>
                  <ul className={styles.deleteGroup}>
                    <li className={`btn normal btn_md`}>전체 선택</li>
                    <li className={`btn primary btn_md`}>선택 삭제</li>
                  </ul>
                </div>
                <div className={`${styles.excelBtn} btn btn_md normal`}>
                  엑셀다운로드
                </div>
                <select
                  className={styles.viewSelect}
                  value={itemsPerPage}
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value, 10);
                    setItemsPerPage(newLimit);
                    loadData(1, newLimit);
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
                    <th>요청날짜</th>
                    <th>작업내용</th>
                    <th>승인여부</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                        승인 요청 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request, index) => (
                      <tr key={request.id}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>{request.brand_name}</td>
                        <td>{(request as WorkRequestWithEmployee).employee_name || "-"}</td>
                        <td>{formatDate(request.created_at)}</td>
                        <td className="text_overflow">
                          <p>{request.work_content || "-"}</p>
                        </td>
                        <td>
                          {request.status === "pending" ? (
                            <div className={styles.actionButtons}>
                              <button
                                type="button"
                                className={`btn btnSm primary`}
                                onClick={() => handleApprove(request.id)}
                                disabled={isPending}
                              >
                                승인하기
                              </button>
                              <button
                                type="button"
                                className={`btn btnSm danger`}
                                onClick={() => handleReject(request.id)}
                                disabled={isPending}
                              >
                                반려하기
                              </button>
                            </div>
                          ) : (
                            <span className={getStatusClass(request.status)}>
                              {getStatusLabel(request.status)}
                            </span>
                          )}
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
                onClick={() => currentPage > 1 && loadData(1, itemsPerPage)}
              ></li>
              <li
                className={`${styles.page} ${styles.prev} ${
                  currentPage === 1 ? styles.disabled : ""
                }`}
                onClick={() =>
                  currentPage > 1 && loadData(currentPage - 1, itemsPerPage)
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
                    onClick={() => loadData(pageNum, itemsPerPage)}
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
                  loadData(currentPage + 1, itemsPerPage)
                }
              ></li>
              <li
                className={`${styles.page} ${styles.last} ${
                  currentPage === totalPages ? styles.disabled : ""
                }`}
                onClick={() =>
                  currentPage < totalPages && loadData(totalPages, itemsPerPage)
                }
              ></li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
