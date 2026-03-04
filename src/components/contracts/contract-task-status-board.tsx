"use client";

import { useState, useMemo, useEffect } from "react";
import { getContractWorkRequestsForBoard, updateContractWorkRequestStatus, deleteContractWorkRequest } from "@/app/actions/contract-work-request";
import { getAllEmployees } from "@/app/actions/work-request";
import styles from "./contract-task-status-board.module.css";

type BoardItem = {
  id: string;
  contract_id: string;
  contract_name: string;
  client_name: string;
  brand_name: string;
  manager: string;
  employee_name: string | null;
  created_at: string;
  work_content: string | null;
  work_content_name: string | null;
  status: string;
};

type ContractTaskStatusBoardProps = {
  initialData: BoardItem[];
  currentEmployeeId?: string;
};

export function ContractTaskStatusBoard({ initialData, currentEmployeeId }: ContractTaskStatusBoardProps) {
  const [list, setList] = useState<BoardItem[]>(initialData);
  const [employeeFilter, setEmployeeFilter] = useState<string>(currentEmployeeId ?? "");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState<BoardItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    task: BoardItem;
    nextStatus: "in_progress" | "completed";
  } | null>(null);
  const [cancelConfirmTask, setCancelConfirmTask] = useState<BoardItem | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [cancelDeleting, setCancelDeleting] = useState(false);

  useEffect(() => {
    getAllEmployees().then((r) => {
      if (r.success && r.data) setEmployees(r.data);
    });
  }, []);

  const fetchList = async () => {
    setLoading(true);
    const result = await getContractWorkRequestsForBoard({
      employeeId: employeeFilter || currentEmployeeId || undefined,
      searchKeyword: searchKeyword.trim() || undefined,
      statusFilter: statusFilter === "all" ? undefined : statusFilter === "work_wait" ? "approved" : (statusFilter as any),
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    if (result.success && result.data) {
      setList(result.data);
      setCurrentPage(1);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    fetchList();
  };

  const handleReset = () => {
    setEmployeeFilter("");
    setSearchKeyword("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    getContractWorkRequestsForBoard({}).then((r) => {
      if (r.success && r.data) setList(r.data);
    });
  };

  const getStatusLabel = (status: string) => {
    const m: Record<string, string> = {
      pending: "승인요청",
      approved: "작업 대기",
      in_progress: "작업중",
      completed: "작업완료",
      rejected: "승인반려",
      deleted: "삭제됨",
    };
    return m[status] ?? status;
  };

  const getStatusClass = (status: string) => {
    if (status === "pending" || status === "approved") return styles.approval_request;
    if (status === "in_progress") return styles.approval_request;
    if (status === "completed") return styles.approval_complete;
    if (status === "rejected") return styles.approval_refusal;
    if (status === "deleted") return styles.approval_refusal;
    return styles.statusPending;
  };

  const getNextStatusAction = (status: string) => {
    if (status === "approved") return { label: "작업중으로 변경", nextStatus: "in_progress" as const };
    if (status === "in_progress") return { label: "작업완료로 변경", nextStatus: "completed" as const };
    return null;
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmAction || statusUpdating) return;
    try {
      setStatusUpdating(true);
      const result = await updateContractWorkRequestStatus(confirmAction.task.id, confirmAction.nextStatus);
      if (!result.success) {
        alert(result.error || "상태 변경에 실패했습니다.");
        return;
      }
      setList((prev) => prev.map((item) => (item.id === confirmAction.task.id ? { ...item, status: confirmAction.nextStatus } : item)));
      setSelectedTask(null);
      setConfirmAction(null);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleConfirmCancelRequest = async () => {
    if (!cancelConfirmTask || cancelDeleting) return;
    try {
      setCancelDeleting(true);
      const result = await deleteContractWorkRequest(cancelConfirmTask.id);
      if (!result.success) {
        alert(result.error || "요청 취소에 실패했습니다.");
        return;
      }
      setList((prev) => prev.filter((item) => item.id !== cancelConfirmTask.id));
      setSelectedTask(null);
      setCancelConfirmTask(null);
    } finally {
      setCancelDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedList.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const totalPages = Math.ceil(list.length / itemsPerPage);
  const paginatedList = useMemo(() => {
    const from = (currentPage - 1) * itemsPerPage;
    return list.slice(from, from + itemsPerPage);
  }, [list, currentPage, itemsPerPage]);

  return (
    <div className={styles.wrap}>
      <div className="page_title">
        <h1>업무 현황</h1>
        <div className="btn_wrap">
          <a href="/contracts/tasks/new" className="btn btn_lg primary">
            업무 등록
          </a>
        </div>
      </div>

      <div className={styles.filterBox}>
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>담당자</span>
          <div className={styles.filterControl}>
            <select className={styles.filterSelect} value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
              <option value="">{currentEmployeeId ? "로그인 사용자" : "전체"}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>회사명(브랜드명)</span>
          <div className={styles.filterControl}>
            <input type="text" className={styles.filterInputFull} placeholder="회사명 또는 브랜드명" value={searchKeyword} style={{ maxWidth: "400px" }} onChange={(e) => setSearchKeyword(e.target.value)} />
          </div>
        </div>
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>진행상태</span>
          <div className={styles.filterControl}>
            <div className={styles.statusFilterGroup}>
              <label className={styles.statusFilterItem}>
                <input type="radio" name="statusFilter" checked={statusFilter === "all"} onChange={() => setStatusFilter("all")} />
                전체
              </label>
              <label className={styles.statusFilterItem}>
                <input type="radio" name="statusFilter" checked={statusFilter === "pending"} onChange={() => setStatusFilter("pending")} />
                승인요청
              </label>
              <label className={styles.statusFilterItem}>
                <input type="radio" name="statusFilter" checked={statusFilter === "approved"} onChange={() => setStatusFilter("approved")} />
                승인대기
              </label>
              <label className={styles.statusFilterItem}>
                <input type="radio" name="statusFilter" checked={statusFilter === "work_wait"} onChange={() => setStatusFilter("work_wait")} />
                작업대기
              </label>
              <label className={styles.statusFilterItem}>
                <input type="radio" name="statusFilter" checked={statusFilter === "in_progress"} onChange={() => setStatusFilter("in_progress")} />
                작업중
              </label>
              <label className={styles.statusFilterItem}>
                <input type="radio" name="statusFilter" checked={statusFilter === "completed"} onChange={() => setStatusFilter("completed")} />
                작업완료
              </label>
            </div>
          </div>
        </div>
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>등록일</span>
          <div className={styles.filterControl}>
            <input type="date" className={styles.filterInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span className={styles.dateSep}>~</span>
            <input type="date" className={styles.filterInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className={styles.filterRowActions}>
          <button type="button" className={`btn btn_lg primary`} onClick={handleSearch} disabled={loading}>
            검색
          </button>
          <button type="button" className={`btn btn_lg normal`} onClick={handleReset}>
            초기화
          </button>
        </div>
      </div>

      <div className={styles.tableBox}>
        <div className={styles.tableTop}>
          <p className={styles.topTotal}>
            총 <span>{list.length}</span>건의 업무가 조회되었습니다.
          </p>
          <div className={styles.topBtnGroup}>
            <button type="button" className={`btn btn_md normal`}>
              전체 선택
            </button>
            <button type="button" className={`btn btn_md primary`}>
              선택 삭제
            </button>
            <button type="button" className={`excel_btn btn btn_md normal`}>
              엑셀 다운로드
            </button>
            <select
              className={`viewSelect`}
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}>
              <option value={10}>10개씩 보기</option>
              <option value={50}>50개씩 보기</option>
              <option value={100}>100개씩 보기</option>
              <option value={200}>200개씩 보기</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {list.length === 0 ? (
            <div className={styles.emptyState}>표시할 계약 업무가 없습니다.</div>
          ) : (
            <table className={styles.dataTable}>
              <colgroup>
                <col className={styles.cellCheck} />
                <col className={styles.cellNum} />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={paginatedList.length > 0 && selectedIds.size === paginatedList.length} onChange={toggleSelectAll} />
                  </th>
                  <th>번호</th>
                  <th>회사명</th>
                  <th>브랜드</th>
                  <th>계약명</th>
                  <th>담당자</th>
                  <th>마지막 등록일</th>
                  <th>작업내용</th>
                  <th>진행상황</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((row, index) => (
                  <tr
                    key={row.id}
                    className={styles.rowClickable}
                    onClick={() => setSelectedTask(row)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelectedTask(row);
                    }}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} />
                    </td>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{row.client_name}</td>
                    <td>{row.brand_name}</td>
                    <td>{row.contract_name}</td>
                    <td>{row.employee_name ?? row.manager ?? "-"}</td>
                    <td>{formatDate(row.created_at)}</td>
                    <td className={styles.cellContent}>
                      {row.work_content_name ? `[${row.work_content_name}] ` : ""}
                      {row.work_content || "-"}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(row.status)}`}>{getStatusLabel(row.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <ul>
              <li className={currentPage === 1 ? styles.disabled : ""} onClick={() => currentPage > 1 && setCurrentPage(1)}>
                &laquo;
              </li>
              <li className={currentPage === 1 ? styles.disabled : ""} onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>
                &lsaquo;
              </li>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                if (p < 1) p = 1;
                return (
                  <li key={p} className={currentPage === p ? styles.active : ""} onClick={() => setCurrentPage(p)}>
                    {p}
                  </li>
                );
              })}
              <li className={currentPage === totalPages ? styles.disabled : ""} onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}>
                &rsaquo;
              </li>
              <li className={currentPage === totalPages ? styles.disabled : ""} onClick={() => currentPage < totalPages && setCurrentPage(totalPages)}>
                &raquo;
              </li>
            </ul>
          </div>
        )}
      </div>

      {selectedTask && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTask(null)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div className={styles.modalHeaderLeft}>
                  <h3 className={styles.modalTitle}>
                    {selectedTask.work_content_name ? `[${selectedTask.work_content_name}] ` : ""}
                    {selectedTask.work_content || "계약 업무 상세"}
                  </h3>
                  <p className={styles.modalSubtitle}>
                    <span className={styles.modalSubtitleNormal}>{selectedTask.client_name}</span>
                    <span className={styles.modalSubtitleSeparator}>·</span>
                    <span className={styles.modalSubtitleBold}>{selectedTask.brand_name}</span>
                  </p>
                </div>
                <button type="button" className={styles.modalCloseButton} onClick={() => setSelectedTask(null)} aria-label="닫기" />
              </div>
              <div className={styles.modalGrid}>
                <div className={styles.modalGridItem}>
                  <span className={styles.modalGridLabel}>계약명</span>
                  <p className={styles.modalGridValue}>{selectedTask.contract_name}</p>
                </div>
                <div className={styles.modalGridItem}>
                  <span className={styles.modalGridLabel}>회사명</span>
                  <p className={styles.modalGridValue}>{selectedTask.client_name}</p>
                </div>
                <div className={styles.modalGridItem}>
                  <span className={styles.modalGridLabel}>브랜드</span>
                  <p className={styles.modalGridValue}>{selectedTask.brand_name}</p>
                </div>
                <div className={styles.modalGridItem}>
                  <span className={styles.modalGridLabel}>담당자</span>
                  <p className={styles.modalGridValue}>{selectedTask.employee_name ?? selectedTask.manager ?? "-"}</p>
                </div>
                <div className={styles.modalGridItem}>
                  <span className={styles.modalGridLabel}>진행상황</span>
                  <p className={styles.modalGridValue}>
                    <span className={`${styles.statusBadge} ${getStatusClass(selectedTask.status)}`}>{getStatusLabel(selectedTask.status)}</span>
                  </p>
                </div>
                <div className={styles.modalGridItem}>
                  <span className={styles.modalGridLabel}>등록일</span>
                  <p className={styles.modalGridValue}>{formatDate(selectedTask.created_at)}</p>
                </div>
              </div>
              <div className={styles.modalContentBox}>
                <span className={styles.modalContentBoxLabel}>작업내용</span>
                <p className={styles.modalContentBoxText}>{selectedTask.work_content || "-"}</p>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn_lg normal" onClick={() => setSelectedTask(null)}>
                  닫기
                </button>
                {selectedTask.status === "pending" && (
                  <button type="button" className="btn btn_lg normal" style={{ background: "var(--negative)", color: "#fff", borderColor: "var(--negative)" }} onClick={() => setCancelConfirmTask(selectedTask)}>
                    요청취소
                  </button>
                )}
                {getNextStatusAction(selectedTask.status) && (
                  <button
                    type="button"
                    className="btn btn_lg primary"
                    onClick={() =>
                      setConfirmAction({
                        task: selectedTask,
                        nextStatus: getNextStatusAction(selectedTask.status)!.nextStatus,
                      })
                    }>
                    {getNextStatusAction(selectedTask.status)!.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className={`${styles.modalOverlay} ${styles.modalOverlayConfirm}`} onClick={() => (statusUpdating ? undefined : setConfirmAction(null))}>
          <div className={`${styles.modalContainer} ${styles.modalContainerConfirm}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmModalTitle}>상태를 변경할까요?</h3>
            <p className={styles.confirmModalText}>{confirmAction.nextStatus === "in_progress" ? "작업 대기인 업무를 작업중으로 변경합니다." : "작업중인 업무를 작업완료로 변경합니다."}</p>
            <div className={styles.confirmModalActions}>
              <button type="button" className="btn btn_lg normal" onClick={() => setConfirmAction(null)} disabled={statusUpdating}>
                취소
              </button>
              <button type="button" className="btn btn_lg primary" onClick={handleConfirmStatusChange} disabled={statusUpdating}>
                {statusUpdating ? "변경 중..." : "변경"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelConfirmTask && (
        <div className={`${styles.modalOverlay} ${styles.modalOverlayConfirm}`} onClick={() => (cancelDeleting ? undefined : setCancelConfirmTask(null))}>
          <div className={`${styles.modalContainer} ${styles.modalContainerConfirm}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmModalTitle}>요청을 취소할까요?</h3>
            <p className={styles.confirmModalText}>승인 대기 중인 요청이 취소되며, 목록에서 삭제 처리됩니다.</p>
            <div className={styles.confirmModalActions}>
              <button type="button" className="btn btn_lg normal" onClick={() => setCancelConfirmTask(null)} disabled={cancelDeleting}>
                닫기
              </button>
              <button type="button" className="btn btn_lg normal" style={{ background: "var(--negative)", color: "#fff", borderColor: "var(--negative)" }} onClick={handleConfirmCancelRequest} disabled={cancelDeleting}>
                {cancelDeleting ? "취소 중..." : "요청취소"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
