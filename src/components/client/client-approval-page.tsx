"use client";

import { useState, useTransition } from "react";
import {
  WorkRequest,
  getClientSignatureUrl,
  getWorkRequestDetailForClient,
} from "@/app/actions/work-request";
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
  const [approvalTargetId, setApprovalTargetId] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
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
      const response = await fetch(
        `/api/work-request/${workRequestId}/approve`,
        {
          method: "POST",
        }
      );

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

  const handleOpenApprovalModal = async (workRequestId: string) => {
    setApprovalTargetId(workRequestId);
    setSignatureUrl(null);
    setSignatureError(null);
    setSignatureLoading(true);
    try {
      const result = await getClientSignatureUrl();
      if (result.success) {
        setSignatureUrl(result.url ?? null);
      } else {
        setSignatureError(result.error || "서명을 불러올 수 없습니다.");
      }
    } catch (error) {
      setSignatureError("서명을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setSignatureLoading(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!approvalTargetId) return;
    await handleApprove(approvalTargetId);
    setApprovalTargetId(null);
    setSignatureUrl(null);
    setSignatureError(null);
  };

  const handleReject = async (workRequestId: string) => {
    try {
      const response = await fetch(
        `/api/work-request/${workRequestId}/reject`,
        {
          method: "POST",
        }
      );

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
    return `${String(date.getFullYear()).slice(-2)}.${String(
      date.getMonth() + 1
    ).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
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

  const getApprovalPhaseLabel = (status: string) => {
    return status === "pending" ? "승인 전" : "승인 후";
  };

  const formatWorkPeriod = (
    startDate?: string | null,
    endDate?: string | null
  ) => {
    if (!startDate && !endDate) return "-";
    const start = formatDate(startDate || "");
    const end = formatDate(endDate || "");
    return `${start} ~ ${end}`;
  };

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

  const handleCloseDetailModal = () => {
    setDetailModal({
      isOpen: false,
      workRequest: null,
      isLoading: false,
    });
  };

  const getWorkTypeLabel = (type?: string | null) => {
    if (type === "deduct") return "금액차감형";
    if (type === "maintenance") return "유지보수형";
    return "-";
  };

  const getWorkTypeDetailLabel = (type?: string | null) => {
    const map: Record<string, string> = {
      textEdit: "텍스트 수정",
      codingEdit: "코딩 수정",
      imageEdit: "이미지 수정",
      popupDesign: "팝업 디자인",
      bannerDesign: "배너 디자인",
    };
    return type ? map[type] ?? type : "-";
  };

  const paginatedRequests = workRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const currentWorkType = detailModal.workRequest
    ? ((detailModal.workRequest as any).work_type as string | null)
    : null;

  return (
    <section className={`${styles.approvalList} page_section`}>
      <div className="page_title">
        <h1>승인 현황</h1>
      </div>

      <div className="white_box">
        <div className={styles.boxInner}>
          <h2 className={styles.pageSubTitle}>
            <span className={styles.companyName}>
              {clientName || "(주)케이먼트코퍼레이션"}
            </span>{" "}
            승인 내역 <span className={styles.workCount}>({totalCount}건)</span>
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
                      <td
                        colSpan={6}
                        style={{ textAlign: "center", padding: "40px" }}
                      >
                        승인 요청 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request, index) => (
                      <tr
                        key={request.id}
                        onClick={() => handleOpenDetailModal(request.id)}
                        className={styles.clickableRow}
                      >
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>{request.brand_name}</td>
                        <td>
                          {(request as WorkRequestWithEmployee).employee_name ||
                            "-"}
                        </td>
                        <td>{formatDate(request.created_at)}</td>
                        <td className="text_overflow">
                          <p>{request.work_content || "-"}</p>
                        </td>
                        <td>
                          {request.status === "pending" ? (
                            <div className={styles.actionButtons}>
                              <button
                                type="button"
                                className={`${styles.btnSm} ${styles.primary}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenApprovalModal(request.id);
                                }}
                                disabled={isPending}
                              >
                                승인하기
                              </button>
                              <button
                                type="button"
                                className={`${styles.btnSm} ${styles.danger}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleReject(request.id);
                                }}
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

      {approvalTargetId && (
        <div
          className={styles.signatureOverlay}
          onClick={() => setApprovalTargetId(null)}
        >
          <div
            className={styles.signatureModal}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className={styles.signatureTitle}>서명 확인</h3>
            <p className={styles.signatureDesc}>
              저장된 서명을 확인한 후 승인해 주세요.
            </p>

            {signatureLoading ? (
              <div className={styles.signatureState}>서명을 불러오는 중...</div>
            ) : signatureUrl ? (
              <div className={styles.signatureBox}>
                <img
                  src={signatureUrl}
                  alt="서명 이미지"
                  className={styles.signatureImage}
                />
              </div>
            ) : (
              <div className={styles.signatureState}>
                {signatureError || "저장된 서명이 없습니다."}
              </div>
            )}

            <div className={styles.signatureActions}>
              <button
                type="button"
                className={`btn normal btn_md`}
                onClick={() => setApprovalTargetId(null)}
                disabled={isPending}
              >
                취소
              </button>
              <button
                type="button"
                className={`btn primary btn_md`}
                onClick={handleConfirmApprove}
                disabled={isPending || !signatureUrl}
              >
                확인 후 승인
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModal.isOpen && (
        <div className={styles.detailOverlay} onClick={handleCloseDetailModal}>
          <div
            className={styles.detailModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.detailTitleRow}>
                  <h3 className={styles.detailTitle}>작업 상세</h3>
                  <span
                    className={`${styles.approvalPhaseBadge} ${
                      detailModal.workRequest?.status === "pending"
                        ? styles.beforeApproval
                        : styles.afterApproval
                    }`}
                  >
                    {getApprovalPhaseLabel(
                      detailModal.workRequest?.status || "pending"
                    )}
                  </span>
                </div>
                <p className={styles.detailSubtitle}>
                  {detailModal.workRequest?.brand_name || "-"}
                </p>
              </div>
              <button
                type="button"
                className={`btn normal btn_md`}
                onClick={handleCloseDetailModal}
              >
                닫기
              </button>
            </div>

            {detailModal.isLoading ? (
              <div className={styles.detailLoading}>로딩 중...</div>
            ) : detailModal.workRequest ? (
              <div className={styles.detailBody}>
                <div className={styles.detailGrid}>
                  <div>
                    <span className={styles.detailLabel}>승인 상태</span>
                    <p className={styles.detailValue}>
                      {getStatusLabel(detailModal.workRequest.status)}
                    </p>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>담당자</span>
                    <p className={styles.detailValue}>
                      {detailModal.workRequest.employee_name || "-"}
                    </p>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>요청일</span>
                    <p className={styles.detailValue}>
                      {formatDate(detailModal.workRequest.created_at)}
                    </p>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>작업기간</span>
                    <p className={styles.detailValue}>
                      {formatWorkPeriod(
                        detailModal.workRequest.start_date,
                        detailModal.workRequest.end_date
                      )}
                    </p>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>관리 유형</span>
                    <p className={styles.detailValue}>
                      {getWorkTypeLabel(
                        (detailModal.workRequest as any).work_type
                      )}
                    </p>
                  </div>
                  {currentWorkType === "maintenance" && (
                    <div>
                      <span className={styles.detailLabel}>세부 유형</span>
                      <p className={styles.detailValue}>
                        {getWorkTypeDetailLabel(
                          (detailModal.workRequest as any).work_type_detail
                        )}
                      </p>
                    </div>
                  )}
                  {currentWorkType === "deduct" && (
                    <div>
                      <span className={styles.detailLabel}>금액</span>
                      <p className={styles.detailValue}>
                        {(detailModal.workRequest as any).cost
                          ? Number(
                              (detailModal.workRequest as any).cost
                            ).toLocaleString("ko-KR")
                          : "-"}
                      </p>
                    </div>
                  )}
                  {currentWorkType === "maintenance" && (
                    <div>
                      <span className={styles.detailLabel}>횟수</span>
                      <p className={styles.detailValue}>
                        {(detailModal.workRequest as any).count ?? "-"}
                      </p>
                    </div>
                  )}
                </div>

                {detailModal.workRequest.managed_client?.productType1 ===
                  "maintenance" && (
                  <div className={styles.detailRemaining}>
                    <span className={styles.detailLabel}>잔여 횟수</span>
                    <div className={styles.detailRemainingColumns}>
                      <div className={styles.detailRemainingBox}>
                        <p className={styles.detailRemainingTitle}>승인 전</p>
                        <ul className={styles.detailRemainingList}>
                          <li>
                            텍스트 수정
                            <b>
                              {detailModal.workRequest.managed_client
                                ?.detailTextEditCount ?? "-"}
                            </b>
                          </li>
                          <li>
                            코딩 수정
                            <b>
                              {detailModal.workRequest.managed_client
                                ?.detailCodingEditCount ?? "-"}
                            </b>
                          </li>
                          <li>
                            이미지 수정
                            <b>
                              {detailModal.workRequest.managed_client
                                ?.detailImageEditCount ?? "-"}
                            </b>
                          </li>
                          <li>
                            팝업 디자인
                            <b>
                              {detailModal.workRequest.managed_client
                                ?.detailPopupDesignCount ?? "-"}
                            </b>
                          </li>
                          {detailModal.workRequest.managed_client
                            ?.productType2 === "premium" && (
                            <li>
                              배너 디자인
                              <b>
                                {detailModal.workRequest.managed_client
                                  ?.detailBannerDesignCount ?? "-"}
                              </b>
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className={styles.detailRemainingBox}>
                        <p className={styles.detailRemainingTitle}>승인 후</p>
                        <ul className={styles.detailRemainingList}>
                          <li>
                            텍스트 수정
                            <b>
                              {detailModal.workRequest
                                .approval_text_edit_count ??
                                detailModal.workRequest.managed_client
                                  ?.detailTextEditCount ??
                                "-"}
                            </b>
                          </li>
                          <li>
                            코딩 수정
                            <b>
                              {detailModal.workRequest
                                .approval_coding_edit_count ??
                                detailModal.workRequest.managed_client
                                  ?.detailCodingEditCount ??
                                "-"}
                            </b>
                          </li>
                          <li>
                            이미지 수정
                            <b>
                              {detailModal.workRequest
                                .approval_image_edit_count ??
                                detailModal.workRequest.managed_client
                                  ?.detailImageEditCount ??
                                "-"}
                            </b>
                          </li>
                          <li>
                            팝업 디자인
                            <b>
                              {detailModal.workRequest
                                .approval_popup_design_count ??
                                detailModal.workRequest.managed_client
                                  ?.detailPopupDesignCount ??
                                "-"}
                            </b>
                          </li>
                          {(detailModal.workRequest
                            .approval_banner_design_count !== null ||
                            detailModal.workRequest.managed_client
                              ?.productType2 === "premium") && (
                            <li>
                              배너 디자인
                              <b>
                                {detailModal.workRequest
                                  .approval_banner_design_count ??
                                  detailModal.workRequest.managed_client
                                    ?.detailBannerDesignCount ??
                                  "-"}
                              </b>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {detailModal.workRequest.managed_client?.productType1 ===
                  "deduct" && (
                  <div className={styles.detailRemaining}>
                    <span className={styles.detailLabel}>
                      승인 후 잔여 금액
                    </span>
                    <p className={styles.detailValue}>
                      {detailModal.workRequest.approval_remaining_amount
                        ? detailModal.workRequest.approval_remaining_amount.toLocaleString(
                            "ko-KR"
                          )
                        : detailModal.workRequest.managed_client?.totalAmount
                        ? detailModal.workRequest.managed_client.totalAmount.toLocaleString(
                            "ko-KR"
                          )
                        : "-"}
                    </p>
                  </div>
                )}

                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>작업 내용</span>
                  <p className={styles.detailText}>
                    {detailModal.workRequest.work_content || "-"}
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.detailLoading}>
                업무 정보를 불러올 수 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
