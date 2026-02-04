"use client";

import { useMemo, useState, useEffect } from "react";
import {
  WorkRequest,
  updateWorkRequestStatus,
  getAllEmployees,
  cancelWorkRequest,
} from "@/app/actions/work-request";
import styles from "./operations-task-board.module.css";

const requestTone: Record<string, string> = {
  승인: styles.statusBadgeApproved,
  중: styles.statusBadgePending,
  반려: styles.statusBadgeRejected,
};

const progressTone: Record<string, string> = {
  "진행 중": styles.progressBadgeInProgress,
  대기: styles.progressBadgeWaiting,
  중단: styles.progressBadgeStopped,
  완료: styles.progressBadgeCompleted,
};

type TaskItem = WorkRequest & { client_name?: string | null; employee_name?: string | null };

type OperationsTaskBoardProps = {
  workRequests: TaskItem[];
  currentEmployeeId?: string;
};

export function OperationsTaskBoard({
  workRequests,
  currentEmployeeId,
}: OperationsTaskBoardProps) {
  const [searchField, setSearchField] = useState<"all" | "client" | "brand">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [progressFilter, setProgressFilter] = useState<
    "all" | "waiting" | "in_progress" | "completed" | "rejected"
  >("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    task: TaskItem;
    nextStatus: "in_progress" | "completed";
  } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);

  // 직원 목록 로드
  useEffect(() => {
    const loadEmployees = async () => {
      const result = await getAllEmployees();
      if (result.success && result.data) {
        setEmployees(result.data);
        // 기본값은 "전체 담당자"로 유지
      }
    };
    loadEmployees();
  }, [currentEmployeeId]);

  const getRequestStatusLabel = (status: WorkRequest["status"]) => {
    if (status === "approved") return "승인";
    if (status === "rejected") return "반려";
    if (status === "pending") return "중";
    return "요청";
  };

  const getProgressLabel = (status: WorkRequest["status"]) => {
    if (status === "in_progress") return "진행 중";
    if (status === "completed") return "완료";
    if (status === "approved") return "대기";
    if (status === "pending") return "대기";
    return "중단";
  };

  const getStatusLabel = (status: WorkRequest["status"]) => {
    const statusMap: Record<WorkRequest["status"], string> = {
      pending: "승인요청",
      approved: "승인완료",
      rejected: "승인반려",
      in_progress: "작업중",
      completed: "작업완료",
      deleted: "삭제됨",
    };
    return statusMap[status] ?? status;
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

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = !query
      ? workRequests
      : workRequests.filter((item) => {
          const clientName = (item.client_name ?? "").toLowerCase();
          const brandName = (item.brand_name ?? "").toLowerCase();

          if (searchField === "client") {
            return clientName.includes(query);
          }
          if (searchField === "brand") {
            return brandName.includes(query);
          }
          return clientName.includes(query) || brandName.includes(query);
        });

    // 담당자 필터 적용
    if (employeeFilter !== "all") {
      filtered = filtered.filter((item) => item.employee_id === employeeFilter);
    }

    // 진행상황 필터 적용
    if (progressFilter === "all") return filtered;

    return filtered.filter((item) => {
      if (progressFilter === "waiting") {
        return item.status === "pending" || item.status === "approved";
      }
      if (progressFilter === "in_progress") {
        return item.status === "in_progress";
      }
      if (progressFilter === "completed") {
        return item.status === "completed";
      }
      if (progressFilter === "rejected") {
        return item.status === "rejected";
      }
      return true;
    });
  }, [progressFilter, searchField, searchQuery, workRequests, employeeFilter]);

  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const values =
      searchField === "client"
        ? workRequests.map((item) => item.client_name || "")
        : searchField === "brand"
        ? workRequests.map((item) => item.brand_name || "")
        : workRequests.flatMap((item) => [
            item.client_name || "",
            item.brand_name || "",
          ]);

    const unique = Array.from(
      new Set(values.map((value) => value.trim()).filter(Boolean))
    );

    return unique
      .filter((value) => value.toLowerCase().includes(query))
      .slice(0, 8);
  }, [searchField, searchQuery, workRequests]);

  const handleSuggestionSelect = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);
  };

  const progressCounts = useMemo(() => {
    const counts = {
      all: workRequests.length,
      waiting: 0,
      in_progress: 0,
      completed: 0,
      rejected: 0,
    };
    workRequests.forEach((item) => {
      if (item.status === "pending" || item.status === "approved") {
        counts.waiting += 1;
        return;
      }
      if (item.status === "in_progress") {
        counts.in_progress += 1;
        return;
      }
      if (item.status === "completed") {
        counts.completed += 1;
        return;
      }
      if (item.status === "rejected") {
        counts.rejected += 1;
      }
    });
    return counts;
  }, [workRequests]);

  const getNextStatusAction = (status: WorkRequest["status"]) => {
    if (status === "approved") {
      return { label: "작업중으로 변경", nextStatus: "in_progress" as const };
    }
    if (status === "in_progress") {
      return { label: "작업완료로 변경", nextStatus: "completed" as const };
    }
    return null;
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmAction || statusUpdating) return;
    try {
      setStatusUpdating(true);
      const result = await updateWorkRequestStatus(
        confirmAction.task.id,
        confirmAction.nextStatus,
        confirmAction.task.employee_id || ""
      );
      if (!result.success) {
        alert(result.error || "상태 변경에 실패했습니다.");
        return;
      }
      setSelectedTask(null);
      // 페이지 새로고침하여 최신 데이터 반영
      window.location.reload();
    } finally {
      setStatusUpdating(false);
      setConfirmAction(null);
    }
  };

  const handleCancelRequest = async (workRequestId: string, employeeId: string) => {
    if (!confirm("요청을 취소하시겠습니까?")) {
      return;
    }

    try {
      setCancellingRequestId(workRequestId);
      const result = await cancelWorkRequest(workRequestId, employeeId);
      if (!result.success) {
        alert(result.error || "요청 취소에 실패했습니다.");
        return;
      }
      alert("요청이 취소되었습니다.");
      // 페이지 새로고침하여 최신 데이터 반영
      window.location.reload();
    } catch (error) {
      console.error("요청 취소 오류:", error);
      alert("요청 취소 중 오류가 발생했습니다.");
    } finally {
      setCancellingRequestId(null);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.headerTitle}>
            관리업무 승인 현황
          </h2>
          <p className={styles.headerDescription}>
            고객 요청 및 승인 결과를 기반으로 업무를 진행합니다.
          </p>
        </div>
        <div className={styles.headerActions}>
          <select
            value={searchField}
            onChange={(event) =>
              setSearchField(event.target.value as "all" | "client" | "brand")
            }
            className={styles.searchSelect}
          >
            <option value="all">전체</option>
            <option value="client">거래처</option>
            <option value="brand">브랜드</option>
          </select>
          <div className={styles.searchWrapper}>
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              placeholder="거래처 또는 브랜드명 검색"
              className={styles.searchInput}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className={styles.suggestions}>
                {suggestions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect(value)}
                    className={styles.suggestionItem}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      <div className={styles.filterGroup}>
        {/* 담당자 필터 */}
        <select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className={styles.employeeSelect}
        >
          <option value="all">전체 담당자</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
        {/* 진행상황 필터 */}
        <button
          type="button"
          onClick={() => setProgressFilter("all")}
          className={`${styles.filterButton} ${progressFilter === "all" ? styles.filterButtonActive : ""}`}
        >
          전체 ({progressCounts.all})
        </button>
        <button
          type="button"
          onClick={() => setProgressFilter("waiting")}
          className={`${styles.filterButton} ${progressFilter === "waiting" ? styles.filterButtonActive : ""}`}
        >
          대기 ({progressCounts.waiting})
        </button>
        <button
          type="button"
          onClick={() => setProgressFilter("in_progress")}
          className={`${styles.filterButton} ${progressFilter === "in_progress" ? styles.filterButtonActive : ""}`}
        >
          진행중 ({progressCounts.in_progress})
        </button>
        <button
          type="button"
          onClick={() => setProgressFilter("completed")}
          className={`${styles.filterButton} ${progressFilter === "completed" ? styles.filterButtonActive : ""}`}
        >
          작업완료 ({progressCounts.completed})
        </button>
        <button
          type="button"
          onClick={() => setProgressFilter("rejected")}
          className={`${styles.filterButton} ${progressFilter === "rejected" ? styles.filterButtonActive : ""}`}
        >
          반려 ({progressCounts.rejected})
        </button>
      </div>
      {filteredRequests.length === 0 ? (
        <div className={styles.emptyState}>
          표시할 관리업무가 없습니다.
        </div>
      ) : (
        <div className={styles.taskList}>
          {filteredRequests.map((operation) => {
            const requestStatus = getRequestStatusLabel(operation.status);
            const progressStatus = getProgressLabel(operation.status);
            return (
              <article
                key={operation.id}
                className={styles.taskItem}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTask(operation)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setSelectedTask(operation);
                  }
                }}
              >
                <div className={styles.taskItemContent}>
                  <div className={styles.taskItemLeft}>
                    <p className={styles.taskTitle}>
                      {operation.work_content || "관리 업무"}
                    </p>
                    <p className={styles.taskMeta}>
                      <span className={styles.taskMetaNormal}>
                        {operation.client_name || "거래처"}
                      </span>
                      <span className={styles.taskMetaSeparator}>·</span>
                      <span className={styles.taskMetaBold}>
                        {operation.brand_name}
                      </span>
                    </p>
                  </div>
                  <div className={styles.taskItemRight}>
                    {operation.status === "pending" ||
                    operation.status === "approved" ||
                    operation.status === "rejected" ? (
                      <span
                        className={`${styles.statusBadge} ${requestTone[requestStatus] || styles.statusBadgeDefault}`}
                      >
                        요청 {requestStatus}
                      </span>
                    ) : null}
                    <span
                      className={`${styles.progressBadge} ${progressTone[progressStatus] || styles.progressBadgeDefault}`}
                    >
                      {progressStatus}
                    </span>
                  </div>
                </div>
                <div className={styles.taskFooter}>
                  <span>담당자: {operation.manager || "-"}</span>
                  <div className={styles.taskFooterActions}>
                    <span>최근 업데이트: {formatDate(operation.updated_at)}</span>
                    {operation.status === "pending" && 
                     operation.employee_id === currentEmployeeId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelRequest(operation.id, operation.employee_id || "");
                        }}
                        disabled={cancellingRequestId === operation.id}
                        className={styles.cancelButton}
                      >
                        {cancellingRequestId === operation.id ? "취소 중..." : "요청 취소"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedTask && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedTask(null)}
        >
          <div
            className={styles.modalContainer}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div className={styles.modalHeaderLeft}>
                  <h3 className={styles.modalTitle}>
                    {selectedTask.work_content || "관리 업무 상세"}
                  </h3>
                  <p className={styles.modalSubtitle}>
                    <span className={styles.modalSubtitleNormal}>
                      {selectedTask.client_name || "거래처"}
                    </span>
                    <span className={styles.modalSubtitleSeparator}>·</span>
                    <span className={styles.modalSubtitleBold}>
                      {selectedTask.brand_name}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseButton}
                  onClick={() => setSelectedTask(null)}
                >
                  닫기
                </button>
              </div>

              <div className={styles.modalGrid}>
              <div className={styles.modalGridItem}>
                <span className={styles.modalGridLabel}>요청 상태</span>
                <p className={styles.modalGridValue}>
                  {getStatusLabel(selectedTask.status)}
                </p>
              </div>
              <div className={styles.modalGridItem}>
                <span className={styles.modalGridLabel}>진행 상태</span>
                <p className={styles.modalGridValue}>
                  {getProgressLabel(selectedTask.status)}
                </p>
              </div>
              <div className={styles.modalGridItem}>
                <span className={styles.modalGridLabel}>담당자</span>
                <p className={styles.modalGridValue}>
                  {selectedTask.manager || "-"}
                </p>
              </div>
              <div className={styles.modalGridItem}>
                <span className={styles.modalGridLabel}>작업기간</span>
                <p className={styles.modalGridValue}>
                  {(selectedTask as any).work_period || "-"}
                </p>
              </div>
              <div className={styles.modalGridItem}>
                <span className={styles.modalGridLabel}>관리 유형</span>
                <p className={styles.modalGridValue}>
                  {getWorkTypeLabel((selectedTask as any).work_type)}
                </p>
              </div>
              <div className={styles.modalGridItem}>
                <span className={styles.modalGridLabel}>세부 유형</span>
                <p className={styles.modalGridValue}>
                  {getWorkTypeDetailLabel(
                    (selectedTask as any).work_type_detail
                  )}
                </p>
              </div>
              <div className={styles.modalGridItem}>
                <span className={styles.modalGridLabel}>금액</span>
                <p className={styles.modalGridValue}>
                  {(selectedTask as any).cost
                    ? Number((selectedTask as any).cost).toLocaleString("ko-KR")
                    : "-"}
                </p>
              </div>
              <div className={styles.modalGridItem}>
                <span className={styles.modalGridLabel}>횟수</span>
                <p className={styles.modalGridValue}>
                  {(selectedTask as any).count ?? "-"}
                </p>
              </div>
              <div className={styles.modalGridItem}>
                <span className={styles.modalGridLabel}>등록일</span>
                <p className={styles.modalGridValue}>
                  {formatDate(selectedTask.created_at)}
                </p>
              </div>
              <div className={styles.modalGridItem}>
                <span className={styles.modalGridLabel}>최근 업데이트</span>
                <p className={styles.modalGridValue}>
                  {formatDate(selectedTask.updated_at)}
                </p>
              </div>
            </div>

            <div className={styles.modalContentBox}>
              <span className={styles.modalContentBoxLabel}>요청 내용</span>
              <p className={styles.modalContentBoxText}>
                {selectedTask.work_content || "-"}
              </p>
            </div>

            {getNextStatusAction(selectedTask.status) && (
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalButton}
                  onClick={() => setSelectedTask(null)}
                >
                  닫기
                </button>
                <button
                  type="button"
                  className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
                  onClick={() =>
                    setConfirmAction({
                      task: selectedTask,
                      nextStatus: getNextStatusAction(selectedTask.status)!
                        .nextStatus,
                    })
                  }
                >
                  {getNextStatusAction(selectedTask.status)!.label}
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div
          className={`${styles.modalOverlay} ${styles.modalOverlayConfirm}`}
          onClick={() => (statusUpdating ? null : setConfirmAction(null))}
        >
          <div
            className={`${styles.modalContainer} ${styles.modalContainerConfirm}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className={styles.confirmModalTitle}>
              상태를 변경할까요?
            </h3>
            <p className={styles.confirmModalText}>
              {confirmAction.nextStatus === "in_progress"
                ? "승인된 업무를 작업중으로 변경합니다."
                : "작업중인 업무를 작업완료로 변경합니다."}
            </p>
            <div className={styles.confirmModalActions}>
              <button
                type="button"
                className={styles.modalButton}
                onClick={() => setConfirmAction(null)}
                disabled={statusUpdating}
              >
                취소
              </button>
              <button
                type="button"
                className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
                onClick={handleConfirmStatusChange}
                disabled={statusUpdating}
              >
                변경하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
