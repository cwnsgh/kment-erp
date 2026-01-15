"use client";

import { useMemo, useState } from "react";
import {
  WorkRequest,
  updateWorkRequestStatus,
} from "@/app/actions/work-request";

const requestTone: Record<string, string> = {
  승인: "bg-emerald-50 text-emerald-600 border-emerald-100",
  중: "bg-blue-50 text-blue-600 border-blue-100",
  반려: "bg-rose-50 text-rose-600 border-rose-100",
};

const progressTone: Record<string, string> = {
  "진행 중": "bg-primary text-primary-foreground",
  대기: "bg-slate-100 text-slate-600",
  중단: "bg-slate-200 text-slate-500",
  완료: "bg-emerald-100 text-emerald-700",
};

type TaskItem = WorkRequest & { client_name?: string | null };

type OperationsTaskBoardProps = {
  workRequests: TaskItem[];
};

export function OperationsTaskBoard({
  workRequests,
}: OperationsTaskBoardProps) {
  const [searchField, setSearchField] = useState<"all" | "client" | "brand">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [progressFilter, setProgressFilter] = useState<
    "all" | "waiting" | "in_progress" | "completed" | "rejected"
  >("all");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    task: TaskItem;
    nextStatus: "in_progress" | "completed";
  } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

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
    const filteredBySearch = !query
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

    if (progressFilter === "all") return filteredBySearch;

    return filteredBySearch.filter((item) => {
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
  }, [progressFilter, searchField, searchQuery, workRequests]);

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
    } finally {
      setStatusUpdating(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            관리업무 승인 현황
          </h2>
          <p className="text-sm text-slate-500">
            고객 요청 및 승인 결과를 기반으로 업무를 진행합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={searchField}
            onChange={(event) =>
              setSearchField(event.target.value as "all" | "client" | "brand")
            }
            className="h-9 rounded-md border border-slate-200 px-3 text-sm text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">전체</option>
            <option value="client">거래처</option>
            <option value="brand">브랜드</option>
          </select>
          <div className="relative">
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
              className="h-9 w-64 rounded-md border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-md border border-slate-200 bg-white text-sm shadow-lg">
                {suggestions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect(value)}
                    className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setProgressFilter("all")}
          className={[
            "rounded-full border px-3 py-1 text-xs font-semibold",
            progressFilter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-slate-200 text-slate-600 hover:bg-slate-50",
          ].join(" ")}
        >
          전체 ({progressCounts.all})
        </button>
        <button
          type="button"
          onClick={() => setProgressFilter("waiting")}
          className={[
            "rounded-full border px-3 py-1 text-xs font-semibold",
            progressFilter === "waiting"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-slate-200 text-slate-600 hover:bg-slate-50",
          ].join(" ")}
        >
          대기 ({progressCounts.waiting})
        </button>
        <button
          type="button"
          onClick={() => setProgressFilter("in_progress")}
          className={[
            "rounded-full border px-3 py-1 text-xs font-semibold",
            progressFilter === "in_progress"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-slate-200 text-slate-600 hover:bg-slate-50",
          ].join(" ")}
        >
          진행중 ({progressCounts.in_progress})
        </button>
        <button
          type="button"
          onClick={() => setProgressFilter("completed")}
          className={[
            "rounded-full border px-3 py-1 text-xs font-semibold",
            progressFilter === "completed"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-slate-200 text-slate-600 hover:bg-slate-50",
          ].join(" ")}
        >
          작업완료 ({progressCounts.completed})
        </button>
        <button
          type="button"
          onClick={() => setProgressFilter("rejected")}
          className={[
            "rounded-full border px-3 py-1 text-xs font-semibold",
            progressFilter === "rejected"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-slate-200 text-slate-600 hover:bg-slate-50",
          ].join(" ")}
        >
          반려 ({progressCounts.rejected})
        </button>
      </div>
      {filteredRequests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
          표시할 관리업무가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((operation) => {
            const requestStatus = getRequestStatusLabel(operation.status);
            const progressStatus = getProgressLabel(operation.status);
            return (
              <article
                key={operation.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTask(operation)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setSelectedTask(operation);
                  }
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {operation.work_content || "관리 업무"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-normal text-slate-400">
                        {operation.client_name || "거래처"}
                      </span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span className="font-semibold text-slate-800">
                        {operation.brand_name}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {operation.status === "pending" ||
                    operation.status === "approved" ||
                    operation.status === "rejected" ? (
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          requestTone[requestStatus] ??
                            "bg-slate-100 text-slate-600 border-slate-200",
                        ].join(" ")}
                      >
                        요청 {requestStatus}
                      </span>
                    ) : null}
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        progressTone[progressStatus] ??
                          "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {progressStatus}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>담당자: {operation.manager || "-"}</span>
                  <span>최근 업데이트: {formatDate(operation.updated_at)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedTask.work_content || "관리 업무 상세"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  <span className="font-normal text-slate-400">
                    {selectedTask.client_name || "거래처"}
                  </span>
                  <span className="mx-1 text-slate-300">·</span>
                  <span className="font-semibold text-slate-800">
                    {selectedTask.brand_name}
                  </span>
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
                onClick={() => setSelectedTask(null)}
              >
                닫기
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <span className="text-xs text-slate-400">요청 상태</span>
                <p className="mt-1 font-medium">
                  {getStatusLabel(selectedTask.status)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">진행 상태</span>
                <p className="mt-1 font-medium">
                  {getProgressLabel(selectedTask.status)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">담당자</span>
                <p className="mt-1 font-medium">
                  {selectedTask.manager || "-"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">작업기간</span>
                <p className="mt-1 font-medium">
                  {(selectedTask as any).work_period || "-"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">관리 유형</span>
                <p className="mt-1 font-medium">
                  {getWorkTypeLabel((selectedTask as any).work_type)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">세부 유형</span>
                <p className="mt-1 font-medium">
                  {getWorkTypeDetailLabel(
                    (selectedTask as any).work_type_detail
                  )}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">금액</span>
                <p className="mt-1 font-medium">
                  {(selectedTask as any).cost
                    ? Number((selectedTask as any).cost).toLocaleString("ko-KR")
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">횟수</span>
                <p className="mt-1 font-medium">
                  {(selectedTask as any).count ?? "-"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">등록일</span>
                <p className="mt-1 font-medium">
                  {formatDate(selectedTask.created_at)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">최근 업데이트</span>
                <p className="mt-1 font-medium">
                  {formatDate(selectedTask.updated_at)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="text-xs text-slate-400">요청 내용</span>
              <p className="mt-2 whitespace-pre-wrap">
                {selectedTask.work_content || "-"}
              </p>
            </div>

            {getNextStatusAction(selectedTask.status) && (
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
                  onClick={() => setSelectedTask(null)}
                >
                  닫기
                </button>
                <button
                  type="button"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
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
      )}

      {confirmAction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => (statusUpdating ? null : setConfirmAction(null))}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900">
              상태를 변경할까요?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {confirmAction.nextStatus === "in_progress"
                ? "승인된 업무를 작업중으로 변경합니다."
                : "작업중인 업무를 작업완료로 변경합니다."}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
                onClick={() => setConfirmAction(null)}
                disabled={statusUpdating}
              >
                취소
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
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
