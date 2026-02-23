"use client";

import { useState, useTransition, useEffect } from "react";
import { WorkRequest, getClientSignatureUrl, getWorkRequestDetailForClient } from "@/app/actions/work-request";
import { buildExcelFilename, downloadExcel } from "@/lib/excel-download";
import styles from "./client-approval-page.module.css";

type WorkRequestWithEmployee = WorkRequest & {
  employee_name?: string | null;
};

type ContractWorkRequestItem = {
  id: string;
  contract_id: string;
  contract_name: string;
  work_content_name: string | null;
  brand_name: string;
  manager: string;
  work_period: string | null;
  work_content: string | null;
  memo: string | null;
  status: string;
  created_at: string;
  employee_name: string | null;
};

type ClientApprovalPageProps = {
  initialWorkRequests: WorkRequest[];
  clientName?: string;
};

export function ClientApprovalPage({ initialWorkRequests, clientName = "" }: ClientApprovalPageProps) {
  const [activeTab, setActiveTab] = useState<"manage" | "contract">("manage");
  const [workRequests, setWorkRequests] = useState<WorkRequestWithEmployee[]>(initialWorkRequests as WorkRequestWithEmployee[]);
  const [contractWorkRequests, setContractWorkRequests] = useState<ContractWorkRequestItem[]>([]);
  const [contractTotalCount, setContractTotalCount] = useState(0);
  const [contractPage, setContractPage] = useState(1);
  const [contractItemsPerPage, setContractItemsPerPage] = useState(10);
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const itemsPerPageOptions = [10, 50, 100, 200];
  const [approvalTargetId, setApprovalTargetId] = useState<string | null>(null);
  const [approvalTargetType, setApprovalTargetType] = useState<"work_request" | "contract_work_request">("work_request");
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
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

  // 승인 현황 통계 계산 (관리 업무)
  const approvalStats = {
    pending: workRequests.filter((r) => r.status === "pending").length,
    rejected: workRequests.filter((r) => r.status === "rejected").length,
    approved: workRequests.filter((r) => r.status === "approved").length,
  };

  const totalCount = workRequests.length;

  const loadContractData = async (page: number, limit: number) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/client/contract-work-requests?statusFilter=all&page=${page}&limit=${limit}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setContractWorkRequests(data.data);
            setContractTotalCount(data.totalCount ?? 0);
            setContractPage(page);
          }
        }
      } catch (error) {
        console.error("계약 업무 요청 조회 오류:", error);
      }
    });
  };

  useEffect(() => {
    if (activeTab === "contract") {
      loadContractData(1, contractItemsPerPage);
    }
  }, [activeTab]);

  const loadData = async (page: number, limit: number) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/client/work-requests?statusFilter=all&page=${page}&limit=${limit}`);
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

  const handleExcelDownload = () => {
    downloadExcel("/api/client/approvals/export", buildExcelFilename("승인현황-목록"));
  };

  const handleApprove = async (workRequestId: string) => {
    if (approvingRequestId) return; // 이미 승인 처리 중이면 무시

    setApprovingRequestId(workRequestId);
    try {
      const response = await fetch(`/api/work-request/${workRequestId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          loadData(currentPage, itemsPerPage);
          // 상세 모달이 열려있고 승인한 업무와 같으면 데이터 다시 불러오기
          if (detailModal.isOpen && detailModal.workRequest?.id === workRequestId) {
            handleOpenDetailModal(workRequestId);
          }
        } else {
          alert(data.error || "승인 처리에 실패했습니다.");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "승인 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 처리 오류:", error);
      alert("승인 처리 중 오류가 발생했습니다.");
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleOpenApprovalModal = async (workRequestId: string, type: "work_request" | "contract_work_request" = "work_request") => {
    setApprovalTargetId(workRequestId);
    setApprovalTargetType(type);
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
    if (approvalTargetType === "contract_work_request") {
      await handleContractApprove(approvalTargetId);
    } else {
      await handleApprove(approvalTargetId);
    }
    setApprovalTargetId(null);
    setSignatureUrl(null);
    setSignatureError(null);
  };

  const handleContractApprove = async (requestId: string) => {
    if (approvingRequestId) return;
    setApprovingRequestId(requestId);
    try {
      const response = await fetch(`/api/contract-work-request/${requestId}/approve`, { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          loadContractData(contractPage, contractItemsPerPage);
        } else {
          alert(data.error || "승인 처리에 실패했습니다.");
        }
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.error || "승인 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("계약 업무 승인 오류:", error);
      alert("승인 처리 중 오류가 발생했습니다.");
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleContractReject = async (requestId: string) => {
    const reason = window.prompt("거절 사유를 입력해 주세요 (선택)");
    if (reason === null) return;
    try {
      const response = await fetch(`/api/contract-work-request/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: reason || "" }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          loadContractData(contractPage, contractItemsPerPage);
        } else {
          alert(data.error || "거절 처리에 실패했습니다.");
        }
      } else {
        alert("거절 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("계약 업무 거절 오류:", error);
      alert("거절 처리 중 오류가 발생했습니다.");
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

  const getApprovalPhaseLabel = (status: string) => {
    return status === "pending" ? "승인 전" : "승인 후";
  };

  const formatWorkPeriod = (startDate?: string | null, endDate?: string | null) => {
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
    return type ? (map[type] ?? type) : "-";
  };

  const paginatedRequests = workRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const contractStats = {
    pending: contractWorkRequests.filter((r) => r.status === "pending").length,
    rejected: contractWorkRequests.filter((r) => r.status === "rejected").length,
    approved: contractWorkRequests.filter((r) => r.status === "approved").length,
  };
  const contractTotalPages = Math.ceil(contractTotalCount / contractItemsPerPage);
  const paginatedContractRequests = contractWorkRequests;

  const currentWorkType = detailModal.workRequest
    ? ((detailModal.workRequest as any).work_type as string | null)
    : null;

  // 유지보수형: 승인 전 = (이미 승인된 건) 승인 후 + 이번 요청 사용 횟수 / (미승인 건) 현재 잔여
  const getBeforeCount = (type: "textEdit" | "codingEdit" | "imageEdit" | "popupDesign" | "bannerDesign") => {
    const wr = detailModal.workRequest;
    if (!wr?.managed_client) return "-";
    if (wr.status !== "approved") {
      switch (type) {
        case "textEdit": return wr.managed_client?.detailTextEditCount ?? "-";
        case "codingEdit": return wr.managed_client?.detailCodingEditCount ?? "-";
        case "imageEdit": return wr.managed_client?.detailImageEditCount ?? "-";
        case "popupDesign": return wr.managed_client?.detailPopupDesignCount ?? "-";
        case "bannerDesign": return wr.managed_client?.detailBannerDesignCount ?? "-";
        default: return "-";
      }
    }
    const raw = wr as any;
    // 승인된 건: DB에 저장된 "승인 전" 스냅샷이 있으면 사용 (RPC에서 저장)
    const before = (() => {
      switch (type) {
        case "textEdit": return raw.approval_before_text_edit_count;
        case "codingEdit": return raw.approval_before_coding_edit_count;
        case "imageEdit": return raw.approval_before_image_edit_count;
        case "popupDesign": return raw.approval_before_popup_design_count;
        case "bannerDesign": return raw.approval_before_banner_design_count;
        default: return undefined;
      }
    })();
    if (before != null) return Number(before);
    // fallback: 승인 후 + 이번 요청 사용분 (과거 데이터용)
    const after = (() => {
      switch (type) {
        case "textEdit": return wr.approval_text_edit_count ?? 0;
        case "codingEdit": return wr.approval_coding_edit_count ?? 0;
        case "imageEdit": return wr.approval_image_edit_count ?? 0;
        case "popupDesign": return wr.approval_popup_design_count ?? 0;
        case "bannerDesign": return wr.approval_banner_design_count ?? 0;
        default: return 0;
      }
    })();
    const usage = raw.request_usage;
    const detailRaw = raw.work_type_detail ?? raw.workTypeDetail ?? usage?.work_type_detail ?? "";
    const detail = String(detailRaw).trim() || "";
    const count = Math.max(0, Number(raw.count ?? usage?.count ?? 0));
    const used = detail === type ? count : 0;
    return after + used;
  };

  // 유지보수형: 승인 후 = 승인 전 - 이번 요청에서 해당 타입으로 쓴 횟수 (상세에 나오는 세부유형·횟수 기준)
  const getAfterCount = (type: "textEdit" | "codingEdit" | "imageEdit" | "popupDesign" | "bannerDesign") => {
    const before = getBeforeCount(type);
    if (before === "-") return "-";
    const wr = detailModal.workRequest;
    if (!wr) return "-";
    const raw = wr as any;
    const usage = raw.request_usage;
    const detailRaw = raw.work_type_detail ?? raw.workTypeDetail ?? usage?.work_type_detail ?? "";
    const detail = String(detailRaw).trim() || "";
    const count = Math.max(0, Number(raw.count ?? usage?.count ?? 0));
    const used = detail === type ? count : 0;
    return Number(before) - used;
  };

  return (
    <section className={`${styles.approvalList} page_section`}>
      <div className="page_title">
        <h1>승인 현황</h1>
      </div>

      <div className="white_box">
        <div className={styles.boxInner}>
          <div className={styles.tabRow}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "manage" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("manage")}>
              관리 업무
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "contract" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("contract")}>
              계약 업무
            </button>
          </div>

          <h2 className={styles.pageSubTitle}>
            <span className={styles.companyName}>{clientName || "(주)케이먼트코퍼레이션"}</span> 승인 내역{" "}
            <span className={styles.workCount}>
              ({activeTab === "manage" ? totalCount : contractTotalCount}건)
            </span>
          </h2>

          {activeTab === "manage" && (
            <>
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
                <div className={`${styles.excelBtn} btn btn_md normal excel_btn`} onClick={handleExcelDownload}>
                  엑셀다운로드
                </div>
                <select
                  className={`${styles.viewSelect} viewSelect`}
                  value={itemsPerPage}
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value, 10);
                    setItemsPerPage(newLimit);
                    loadData(1, newLimit);
                  }}>
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
                      <tr key={request.id} onClick={() => handleOpenDetailModal(request.id)} className={styles.clickableRow}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>{request.brand_name}</td>
                        <td>{(request as WorkRequestWithEmployee).employee_name || "-"}</td>
                        <td>{formatDate(request.created_at)}</td>
                        <td className={`${styles.text_overflow}`}>
                          <p>{request.work_content || "-"}</p>
                        </td>
                        <td>
                          {request.status === "pending" ? (
                            <div className={styles.actionButtons}>
                              <button
                                type="button"
                                className={`${styles.btnSm} ${styles.primary} btn btn_md primary`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenApprovalModal(request.id);
                                }}
                                disabled={isPending || approvingRequestId === request.id}>
                                {approvingRequestId === request.id ? "승인 중..." : "승인하기"}
                              </button>
                              <button
                                type="button"
                                className={`${styles.btnSm} ${styles.danger} btn btn_md danger`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleReject(request.id);
                                }}
                                disabled={isPending || approvingRequestId === request.id}>
                                반려하기
                              </button>
                            </div>
                          ) : (
                            <span className={getStatusClass(request.status)}>{getStatusLabel(request.status)}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <ul>
              <li className={`${styles.page} ${styles.first} ${currentPage === 1 ? styles.disabled : ""}`} onClick={() => currentPage > 1 && loadData(1, itemsPerPage)}></li>
              <li className={`${styles.page} ${styles.prev} ${currentPage === 1 ? styles.disabled : ""}`} onClick={() => currentPage > 1 && loadData(currentPage - 1, itemsPerPage)}></li>

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
                  <li key={pageNum} className={`${styles.page} ${currentPage === pageNum ? styles.active : ""}`} onClick={() => loadData(pageNum, itemsPerPage)}>
                    {pageNum}
                  </li>
                );
              })}

              <li className={`${styles.page} ${styles.next} ${currentPage === totalPages ? styles.disabled : ""}`} onClick={() => currentPage < totalPages && loadData(currentPage + 1, itemsPerPage)}></li>
              <li className={`${styles.page} ${styles.last} ${currentPage === totalPages ? styles.disabled : ""}`} onClick={() => currentPage < totalPages && loadData(totalPages, itemsPerPage)}></li>
            </ul>
          </div>
        )}
            </>
          )}

          {activeTab === "contract" && (
            <>
          <div className={styles.statusBox}>
            <div className={styles.request}>
              <span>승인요청</span>
              <p className="font_b">{contractStats.pending}건</p>
            </div>
            <div className={styles.refusal}>
              <span>승인반려</span>
              <p className="font_b">{contractStats.rejected}건</p>
            </div>
            <div className={styles.complete}>
              <span>승인완료</span>
              <p className="font_b">{contractStats.approved}건</p>
            </div>
          </div>
          <div className={styles.listTable}>
            <div className={styles.tableTop}>
              <div className={styles.topTotal}>
                <p>총 <span>{contractTotalCount}건</span>의 계약 업무 승인현황이 조회되었습니다.</p>
              </div>
              <div className={styles.topBtnGroup}>
                <select
                  className="viewSelect"
                  value={contractItemsPerPage}
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value, 10);
                    setContractItemsPerPage(newLimit);
                    loadContractData(1, newLimit);
                  }}>
                  {itemsPerPageOptions.map((option) => (
                    <option key={option} value={option}>{option}개씩 보기</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <colgroup>
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "auto" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>계약명</th>
                    <th>작업유형</th>
                    <th>브랜드</th>
                    <th>담당자</th>
                    <th>요청일</th>
                    <th>작업내용</th>
                    <th>승인여부</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContractRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                        계약 업무 요청 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    paginatedContractRequests.map((req, index) => (
                      <tr key={req.id}>
                        <td>{(contractPage - 1) * contractItemsPerPage + index + 1}</td>
                        <td>{req.contract_name}</td>
                        <td>{req.work_content_name ?? "-"}</td>
                        <td>{req.brand_name}</td>
                        <td>{req.employee_name ?? req.manager ?? "-"}</td>
                        <td>{formatDate(req.created_at)}</td>
                        <td className={styles.text_overflow}><p>{req.work_content || "-"}</p></td>
                        <td>
                          {req.status === "pending" ? (
                            <div className={styles.actionButtons}>
                              <button
                                type="button"
                                className={`${styles.btnSm} ${styles.primary} btn btn_md primary`}
                                onClick={() => handleOpenApprovalModal(req.id, "contract_work_request")}
                                disabled={!!approvingRequestId}>
                                {approvingRequestId === req.id ? "승인 중..." : "승인하기"}
                              </button>
                              <button
                                type="button"
                                className={`${styles.btnSm} ${styles.danger} btn btn_md danger`}
                                onClick={() => handleContractReject(req.id)}
                                disabled={!!approvingRequestId}>
                                반려하기
                              </button>
                            </div>
                          ) : (
                            <span className={getStatusClass(req.status)}>{getStatusLabel(req.status)}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {contractTotalPages > 1 && (
            <div className={styles.pagination}>
              <ul>
                <li className={`${styles.page} ${styles.first} ${contractPage === 1 ? styles.disabled : ""}`} onClick={() => contractPage > 1 && loadContractData(1, contractItemsPerPage)}></li>
                <li className={`${styles.page} ${styles.prev} ${contractPage === 1 ? styles.disabled : ""}`} onClick={() => contractPage > 1 && loadContractData(contractPage - 1, contractItemsPerPage)}></li>
                {Array.from({ length: Math.min(contractTotalPages, 5) }, (_, i) => {
                  let pageNum = contractTotalPages <= 5 ? i + 1 : contractPage - 2 + i;
                  if (contractTotalPages > 5 && contractPage <= 3) pageNum = i + 1;
                  else if (contractTotalPages > 5 && contractPage >= contractTotalPages - 2) pageNum = contractTotalPages - 4 + i;
                  return (
                    <li key={pageNum} className={`${styles.page} ${contractPage === pageNum ? styles.active : ""}`} onClick={() => loadContractData(pageNum, contractItemsPerPage)}>
                      {pageNum}
                    </li>
                  );
                })}
                <li className={`${styles.page} ${styles.next} ${contractPage === contractTotalPages ? styles.disabled : ""}`} onClick={() => contractPage < contractTotalPages && loadContractData(contractPage + 1, contractItemsPerPage)}></li>
                <li className={`${styles.page} ${styles.last} ${contractPage === contractTotalPages ? styles.disabled : ""}`} onClick={() => contractPage < contractTotalPages && loadContractData(contractTotalPages, contractItemsPerPage)}></li>
              </ul>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {approvalTargetId && (
        <div className={styles.signatureOverlay} onClick={() => setApprovalTargetId(null)}>
          <div className={styles.signatureModal} onClick={(event) => event.stopPropagation()}>
            <h3 className={styles.signatureTitle}>서명 확인</h3>
            <p className={styles.signatureDesc}>저장된 서명을 확인한 후 승인해 주세요.</p>

            {signatureLoading ? (
              <div className={styles.signatureState}>서명을 불러오는 중...</div>
            ) : signatureUrl ? (
              <div className={styles.signatureBox}>
                <img src={signatureUrl ?? undefined} alt="서명 이미지" className={styles.signatureImage} />
              </div>
            ) : (
              <div className={styles.signatureState}>{signatureError || "저장된 서명이 없습니다. 서명 없이도 승인할 수 있습니다."}</div>
            )}

            <div className={styles.signatureActions}>
              <button type="button" className={`btn normal btn_md`} onClick={() => setApprovalTargetId(null)} disabled={isPending || !!(approvalTargetId && approvingRequestId === approvalTargetId)}>
                취소
              </button>
              <button type="button" className={`btn primary btn_md`} onClick={handleConfirmApprove} disabled={isPending || !!(approvalTargetId && approvingRequestId === approvalTargetId)}>
                {approvalTargetId && approvingRequestId === approvalTargetId ? "승인 중..." : signatureUrl ? "확인 후 승인" : "서명 없이 승인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModal.isOpen && (
        <div className={styles.detailOverlay} onClick={handleCloseDetailModal}>
          <div className={styles.detailModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.detailTitleRow}>
                  <h3 className={styles.detailTitle}>작업 상세 조회</h3>
                  <span className={`${styles.approvalPhaseBadge} ${detailModal.workRequest?.status === "pending" ? styles.beforeApproval : styles.afterApproval}`}>{getApprovalPhaseLabel(detailModal.workRequest?.status || "pending")}</span>
                </div>
                <p className={styles.detailSubtitle}>{detailModal.workRequest?.brand_name || "-"}</p>
              </div>
              <button type="button" className={styles.detailModalClose} onClick={handleCloseDetailModal}></button>
            </div>

            {detailModal.isLoading ? (
              <div className={styles.detailLoading}>로딩 중...</div>
            ) : detailModal.workRequest ? (
              (() => {
                const wr = detailModal.workRequest;
                return (
              <div className={styles.detailBody}>
                <div className={styles.detailGrid}>
                  <div>
                    <span className={styles.detailLabel}>승인 상태</span>
                    <p className={styles.detailValue}>{getStatusLabel(wr.status)}</p>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>담당자</span>
                    <p className={styles.detailValue}>{wr.employee_name || "-"}</p>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>요청일</span>
                    <p className={styles.detailValue}>{formatDate(wr.created_at)}</p>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>작업기간</span>
                    <p className={styles.detailValue}>{formatWorkPeriod(wr.start_date, wr.end_date)}</p>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>관리 유형</span>
                    <p className={styles.detailValue}>{getWorkTypeLabel((wr as any).work_type)}</p>
                  </div>
                  {currentWorkType === "maintenance" && (
                    <div>
                      <span className={styles.detailLabel}>세부 유형</span>
                      <p className={styles.detailValue}>{getWorkTypeDetailLabel((wr as any).work_type_detail)}</p>
                    </div>
                  )}
                  {currentWorkType === "deduct" && (
                    <div>
                      <span className={styles.detailLabel}>금액</span>
                      <p className={styles.detailValue}>{(wr as any).cost ? Number((wr as any).cost).toLocaleString("ko-KR") : "-"}</p>
                    </div>
                  )}
                  {currentWorkType === "maintenance" && (
                    <div>
                      <span className={styles.detailLabel}>횟수</span>
                      <p className={styles.detailValue}>{(wr as any).count ?? "-"}</p>
                    </div>
                  )}
                </div>

                {/* 이 요청이 유지보수형으로 신청된 경우만 잔여 횟수 표시 (관리유형이 나중에 바뀌어도 요청 당시 기준) */}
                {(wr as any).work_type === "maintenance" && (
                  <div className={styles.detailRemaining}>
                    <span className={styles.detailLabel}>잔여 횟수</span>
                    <div className={styles.detailRemainingColumns}>
                      <div className={styles.detailRemainingBox}>
                        <p className={styles.detailRemainingTitle}>승인 전</p>
                        <ul className={styles.detailRemainingList}>
                          <li>
                            텍스트 수정
                            <b>{getBeforeCount("textEdit")}</b>
                          </li>
                          <li>
                            코딩 수정
                            <b>{getBeforeCount("codingEdit")}</b>
                          </li>
                          <li>
                            이미지 수정
                            <b>{getBeforeCount("imageEdit")}</b>
                          </li>
                          <li>
                            팝업 디자인
                            <b>{getBeforeCount("popupDesign")}</b>
                          </li>
                          {wr.managed_client?.productType2 === "premium" && (
                            <li>
                              배너 디자인
                              <b>{getBeforeCount("bannerDesign")}</b>
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className={styles.detailRemainingBox}>
                        <p className={styles.detailRemainingTitle}>승인 후</p>
                        <ul className={styles.detailRemainingList}>
                          <li>
                            텍스트 수정
                            <b>{getAfterCount("textEdit")}</b>
                          </li>
                          <li>
                            코딩 수정
                            <b>{getAfterCount("codingEdit")}</b>
                          </li>
                          <li>
                            이미지 수정
                            <b>{getAfterCount("imageEdit")}</b>
                          </li>
                          <li>
                            팝업 디자인
                            <b>{getAfterCount("popupDesign")}</b>
                          </li>
                          {wr.managed_client?.productType2 === "premium" && (
                            <li>
                              배너 디자인
                              <b>{getAfterCount("bannerDesign")}</b>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 이 요청이 금액차감형으로 신청된 경우만 잔여 금액 표시 (관리유형이 나중에 바뀌어도 요청 당시 기준) */}
                {(wr as any).work_type === "deduct" && (
                  <div className={styles.detailRemaining}>
                    <span className={styles.detailLabel}>승인 후 잔여 금액</span>
                    <p className={styles.detailValue}>
                      {(() => {
                        if (wr.approval_remaining_amount != null) {
                          return wr.approval_remaining_amount.toLocaleString("ko-KR");
                        }
                        const currentAmount = wr.managed_client?.totalAmount || 0;
                        const requestCost = (wr as any).cost || 0;
                        const remainingAmount = Math.max(0, currentAmount - requestCost);
                        return remainingAmount.toLocaleString("ko-KR");
                      })()}
                    </p>
                  </div>
                )}

                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>작업 내용</span>
                  <p className={styles.detailText}>{wr.work_content || "-"}</p>
                </div>
              </div>
                );
              })()
            ) : (
              <div className={styles.detailLoading}>업무 정보를 불러올 수 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
