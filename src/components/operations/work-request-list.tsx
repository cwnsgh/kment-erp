"use client";

import { useState, useEffect, useRef } from "react";
import {
  getWorkRequestsByClientIdForEmployee,
  updateWorkRequestStatus,
  getWorkRequestDetailForEmployee,
  getAllEmployees,
  type WorkRequest,
} from "@/app/actions/work-request";
import { buildExcelFilename, downloadExcel } from "@/lib/excel-download";
import styles from "./work-request-list.module.css";

interface WorkRequestListProps {
  clientId: string;
  clientName: string;
  currentEmployeeId: string;
  initialWorkRequests?: WorkRequest[];
  initialTotalCount?: number;
}

export default function WorkRequestList({
  clientId,
  clientName,
  currentEmployeeId,
  initialWorkRequests = [],
  initialTotalCount = 0,
}: WorkRequestListProps) {
  const [workRequests, setWorkRequests] =
    useState<WorkRequest[]>(initialWorkRequests);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchType, setSearchType] = useState<"brand" | "manager">("brand");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "in_progress" | "completed"
  >("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    workRequestId: string | null;
    workRequestBrand: string | null;
    newStatus: "in_progress" | "completed" | null;
  }>({
    isOpen: false,
    workRequestId: null,
    workRequestBrand: null,
    newStatus: null,
  });
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

  const handleExcelDownload = () => {
    const params = new URLSearchParams();
    params.set("clientId", clientId);
    params.set("statusFilter", statusFilter);
    params.set("searchType", searchType);
    if (searchKeyword.trim()) {
      params.set("searchKeyword", searchKeyword.trim());
    }

    downloadExcel(
      `/api/operations/work-requests/export?${params.toString()}`,
      buildExcelFilename("관리업무-목록")
    );
  };

  // 초기 로드 여부 플래그
  const [hasInitialLoad, setHasInitialLoad] = useState(
    initialWorkRequests.length > 0
  );

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const dropdownRef = dropdownRefs.current[openDropdownId];
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId]);

  // 스크롤 시 드롭다운 닫기
  useEffect(() => {
    const handleScroll = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
    };

    window.addEventListener("scroll", handleScroll, { capture: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [openDropdownId]);

  // 데이터 로드
  const loadData = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const result = await getWorkRequestsByClientIdForEmployee(
        clientId,
        currentEmployeeId,
        {
          statusFilter,
          searchType,
          searchKeyword: searchKeyword || undefined,
          employeeFilter: employeeFilter !== "all" ? employeeFilter : undefined,
          page,
          limit: itemsPerPage,
        }
      );

      if (result.success && result.data) {
        setWorkRequests(result.data);
        setTotalCount(result.totalCount || 0);
        setCurrentPage(page);
      } else {
        console.error("데이터 로드 실패:", result.error);
        alert(`데이터 로드 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("데이터 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  // 초기 로드 (initialWorkRequests가 없을 때만)
  useEffect(() => {
    if (!hasInitialLoad) {
      loadData(1);
      setHasInitialLoad(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 담당자 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    if (hasInitialLoad) {
      loadData(1);
      setSelectedIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeFilter]);

  // 검색 핸들러
  const handleSearch = () => {
    loadData(1);
    setSelectedIds([]);
  };

  // 검색어와 필터에 따른 데이터 필터링 (담당자 검색은 클라이언트 측에서)
  const filteredWorkRequests = workRequests.filter((wr) => {
    // deleted 상태는 제외
    if (wr.status === "deleted") return false;
    
    if (searchKeyword) {
      if (searchType === "brand") {
        // 브랜드 검색은 서버에서 이미 처리됨
        return true;
      } else if (searchType === "manager") {
        // 담당자 검색은 클라이언트 측에서
        if (
          !wr.employee_name?.toLowerCase().includes(searchKeyword.toLowerCase())
        ) {
          return false;
        }
      }
    }
    return true;
  });

  // 필터링된 데이터의 총 개수
  const filteredTotalCount =
    searchType === "manager" && searchKeyword
      ? filteredWorkRequests.length
      : totalCount;

  // 필터 변경 시 재로드
  useEffect(() => {
    if (hasInitialLoad) {
      loadData(1);
      setSelectedIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, itemsPerPage, hasInitialLoad]);

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentDisplay =
        searchType === "manager" && searchKeyword
          ? filteredWorkRequests
          : workRequests;
      setSelectedIds(currentDisplay.map((wr) => wr.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 개별 선택/해제
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 상태 변경 확인 모달 열기
  const handleStatusChangeClick = (
    workRequestId: string,
    workRequestBrand: string,
    newStatus: "in_progress" | "completed"
  ) => {
    setConfirmModal({
      isOpen: true,
      workRequestId,
      workRequestBrand,
      newStatus,
    });
    setOpenDropdownId(null);
  };

  // 상태 변경 확인
  const handleConfirmStatusChange = async () => {
    if (!confirmModal.workRequestId || !confirmModal.newStatus) return;

    try {
      const result = await updateWorkRequestStatus(
        confirmModal.workRequestId,
        confirmModal.newStatus,
        currentEmployeeId
      );

      if (result.success) {
        // 로컬 상태 업데이트
        setWorkRequests((prev) =>
          prev.map((wr) =>
            wr.id === confirmModal.workRequestId
              ? { ...wr, status: confirmModal.newStatus! }
              : wr
          )
        );
        setConfirmModal({
          isOpen: false,
          workRequestId: null,
          workRequestBrand: null,
          newStatus: null,
        });
      } else {
        alert(`상태 변경 실패: ${result.error}`);
        setConfirmModal({
          isOpen: false,
          workRequestId: null,
          workRequestBrand: null,
          newStatus: null,
        });
      }
    } catch (error) {
      console.error("상태 변경 오류:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
      setConfirmModal({
        isOpen: false,
        workRequestId: null,
        workRequestBrand: null,
        newStatus: null,
      });
    }
  };

  // 확인 모달 닫기
  const handleCancelStatusChange = () => {
    setConfirmModal({
      isOpen: false,
      workRequestId: null,
      workRequestBrand: null,
      newStatus: null,
    });
  };

  // 업무 상세 모달 열기
  const handleOpenDetailModal = async (workRequestId: string) => {
    setDetailModal({
      isOpen: true,
      workRequest: null,
      isLoading: true,
    });

    try {
      const result = await getWorkRequestDetailForEmployee(workRequestId);
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

  // 업무 삭제 핸들러 (직원만 가능)
  const handleDelete = async (workRequestId: string) => {
    if (deletingRequestId) return; // 이미 삭제 처리 중이면 무시
    
    const confirmed = confirm(
      "이 업무를 삭제하시겠습니까?\n금액차감형인 경우 차감된 금액이 복구됩니다."
    );
    
    if (!confirmed) return;

    setDeletingRequestId(workRequestId);
    try {
      const response = await fetch(
        `/api/work-request/${workRequestId}/delete`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 목록 새로고침
          loadData(1);
          setSelectedIds([]);
          // 모달 닫기
          handleCloseDetailModal();
          alert("업무가 삭제되었습니다.");
        } else {
          alert(data.error || "삭제 처리에 실패했습니다.");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "삭제 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("삭제 처리 오류:", error);
      alert("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setDeletingRequestId(null);
    }
  };

  // 드롭다운 토글
  const toggleDropdown = (id: string) => {
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  // 드롭다운 위치 계산
  const getDropdownPosition = (id: string) => {
    const button = document.getElementById(`status-button-${id}`);
    if (!button) return { top: 0, left: 0 };

    const rect = button.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: rect.left + rect.width / 2,
    };
  };

  // 날짜 포맷
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  // 작업기간 포맷
  const formatWorkPeriod = (
    startDate?: string | null,
    endDate?: string | null
  ) => {
    if (!startDate && !endDate) return "-";
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `${start} ~ ${end}`;
  };

  // 상태 레이블
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

  // 상태 클래스
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

  const totalPages = Math.ceil(filteredTotalCount / itemsPerPage);
  const displayWorkRequests =
    searchType === "manager" && searchKeyword
      ? filteredWorkRequests
      : workRequests;

  return (
    <section
      className={`${styles.manageWorkList} manageWork_list page_section`}
    >
      <div className="page_title">
        <h1>관리 업무 조회</h1>
      </div>
      <div className={styles.whiteBox}>
        <div className={styles.boxInner}>
          {/* 검색 영역 */}
          <div className={styles.searchBox}>
            <h2 className={styles.pageSubTitle}>
              <span className={styles.companyName}>{clientName}</span> 업무 내역{" "}
              <span className={styles.workCount}>({totalCount}건)</span>
            </h2>
            <div className={styles.searchFlex}>
              {/* 담당자 필터 */}
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                style={{ marginRight: "8px" }}
              >
                <option value="all">전체 담당자</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <select
                value={searchType}
                onChange={(e) =>
                  setSearchType(e.target.value as "brand" | "manager")
                }
              >
                <option value="brand">브랜드</option>
                <option value="manager">담당자</option>
              </select>
              <input
                type="text"
                name="search_name"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder=""
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              <button
                type="button"
                className={`${styles.btn} ${styles.btnLg} ${styles.primary}`}
                onClick={handleSearch}
              >
                검색
              </button>
            </div>
          </div>

          {/* 테이블 영역 */}
          <div className={styles.listTable}>
            <div className={styles.tableTop}>
              <div className={styles.topTotal}>
                <p>
                  총 <span>{totalCount}</span>건의 관리업무가 조회되었습니다.
                </p>
              </div>
              <div className={styles.topBtnGroup}>
                <div
                  className={`${styles.deleteBtn} ${
                    showDeleteMenu ? styles.show : ""
                  }`}
                  onMouseEnter={() => setShowDeleteMenu(true)}
                  onMouseLeave={() => setShowDeleteMenu(false)}
                >
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.primary} ${styles.btnMd}`}
                    onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                  >
                    삭제
                  </button>
                  <ul className={styles.deleteGroup}>
                    <li>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.normal} ${styles.btnMd}`}
                        onClick={() => {
                          handleSelectAll(true);
                          setShowDeleteMenu(false);
                        }}
                      >
                        전체 선택
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.primary} ${styles.btnMd}`}
                        onClick={() => {
                          alert("선택 삭제 기능은 추후 구현 예정입니다.");
                          setShowDeleteMenu(false);
                        }}
                        disabled={selectedIds.length === 0}
                      >
                        선택 삭제
                      </button>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  className={`${styles.excelBtn} ${styles.btn} ${styles.btnMd} ${styles.normal}`}
                  onClick={handleExcelDownload}
                >
                  엑셀다운로드
                </button>
                <select
                  className={styles.viewSelect}
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                  }}
                >
                  <option value={10}>10개씩 보기</option>
                  <option value={50}>50개씩 보기</option>
                  <option value={100}>100개씩 보기</option>
                  <option value={200}>200개씩 보기</option>
                </select>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <colgroup>
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "auto" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        id="checkAll"
                        checked={
                          displayWorkRequests.length > 0 &&
                          selectedIds.length === displayWorkRequests.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>번호</th>
                    <th>브랜드명</th>
                    <th>담당자</th>
                    <th>요청일</th>
                    <th>승인일</th>
                    <th>상태변경일</th>
                    <th>작업기간</th>
                    <th>작업내용</th>
                    <th>승인여부</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ textAlign: "center", padding: "30px 0" }}
                      >
                        로딩 중...
                      </td>
                    </tr>
                  ) : workRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ textAlign: "center", padding: "30px 0" }}
                      >
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    displayWorkRequests.map((wr, index) => {
                      const isOpen = openDropdownId === wr.id;
                      const dropdownPosition = isOpen
                        ? getDropdownPosition(wr.id)
                        : { top: 0, left: 0 };
                      const canChangeStatus =
                        wr.employee_id === currentEmployeeId &&
                        (wr.status === "approved" ||
                          wr.status === "in_progress");

                      return (
                        <tr
                          key={wr.id}
                          onClick={() => handleOpenDetailModal(wr.id)}
                          style={{ cursor: "pointer" }}
                          className={styles.clickableRow}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="rowCheck"
                              checked={selectedIds.includes(wr.id)}
                              onChange={() => handleToggleSelect(wr.id)}
                            />
                          </td>
                          <td>
                            {filteredTotalCount -
                              (currentPage - 1) * itemsPerPage -
                              index}
                          </td>
                          <td>{wr.brand_name || "-"}</td>
                          <td>{wr.employee_name || "-"}</td>
                          <td>{formatDate(wr.created_at)}</td>
                          <td>{formatDate((wr as any).approved_at)}</td>
                          <td>{formatDate(wr.updated_at)}</td>
                          <td>
                            {formatWorkPeriod(wr.start_date, wr.end_date)}
                          </td>
                          <td
                            className={styles.textOverflow}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p>{wr.work_content || "-"}</p>
                          </td>
                          <td
                            className={styles.statusCell}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {canChangeStatus ? (
                              <div
                                ref={(el) => {
                                  dropdownRefs.current[wr.id] = el;
                                }}
                                style={{ position: "relative" }}
                              >
                                <button
                                  id={`status-button-${wr.id}`}
                                  type="button"
                                  className={`${
                                    styles.statusBadge
                                  } ${getStatusClass(wr.status)}`}
                                  onClick={() => toggleDropdown(wr.id)}
                                >
                                  {getStatusLabel(wr.status)}
                                </button>
                                {isOpen && (
                                  <div
                                    className={styles.statusDropdown}
                                    style={{
                                      position: "fixed",
                                      top: `${dropdownPosition.top}px`,
                                      left: `${dropdownPosition.left}px`,
                                      transform: "translateX(-50%)",
                                    }}
                                  >
                                    <ul className={styles.dropdownMenu}>
                                      {wr.status === "approved" && (
                                        <li>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleStatusChangeClick(
                                                wr.id,
                                                wr.brand_name || "",
                                                "in_progress"
                                              )
                                            }
                                          >
                                            작업중
                                          </button>
                                        </li>
                                      )}
                                      {wr.status === "in_progress" && (
                                        <li>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleStatusChangeClick(
                                                wr.id,
                                                wr.brand_name || "",
                                                "completed"
                                              )
                                            }
                                          >
                                            작업완료
                                          </button>
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span
                                className={`${
                                  styles.statusBadge
                                } ${getStatusClass(wr.status)}`}
                              >
                                {getStatusLabel(wr.status)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <ul>
              <li
                className={`${styles.page} ${styles.first} ${
                  currentPage === 1 ? styles.disabled : ""
                }`}
                onClick={() => {
                  if (currentPage !== 1) {
                    loadData(1);
                  }
                }}
              ></li>
              <li
                className={`${styles.page} ${styles.prev} ${
                  currentPage === 1 ? styles.disabled : ""
                }`}
                onClick={() => {
                  if (currentPage !== 1) {
                    loadData(currentPage - 1);
                  }
                }}
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
                    onClick={() => loadData(pageNum)}
                  >
                    {pageNum}
                  </li>
                );
              })}

              <li
                className={`${styles.page} ${styles.next} ${
                  currentPage === totalPages ? styles.disabled : ""
                }`}
                onClick={() => {
                  if (currentPage !== totalPages) {
                    loadData(currentPage + 1);
                  }
                }}
              ></li>
              <li
                className={`${styles.page} ${styles.last} ${
                  currentPage === totalPages ? styles.disabled : ""
                }`}
                onClick={() => {
                  if (currentPage !== totalPages) {
                    loadData(totalPages);
                  }
                }}
              ></li>
            </ul>
          </div>
        )}
      </div>

      {/* 상태 변경 확인 모달 */}
      {confirmModal.isOpen && (
        <div
          className={styles.modalOverlay}
          onClick={handleCancelStatusChange}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleCancelStatusChange();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>상태 변경 확인</h3>
            </div>
            <div className={styles.modalBody}>
              <p>
                다음 업무의 상태를{" "}
                <strong>
                  {confirmModal.newStatus === "in_progress"
                    ? "작업중"
                    : "작업완료"}
                </strong>
                으로 변경하시겠습니까?
              </p>
              <div className={styles.modalInfo}>
                <p>
                  <strong>브랜드명:</strong> {confirmModal.workRequestBrand}
                </p>
                <p className={styles.warningText}>
                  ⚠️ 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.normal}`}
                onClick={handleCancelStatusChange}
              >
                취소
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.primary}`}
                onClick={handleConfirmStatusChange}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 업무 상세 모달 */}
      {detailModal.isOpen && (
        <div
          className={styles.detailModalOverlay}
          onClick={handleCloseDetailModal}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleCloseDetailModal();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div
            className={styles.detailModalInner}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailModalHeader}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <h3>관리 업무 상세조회</h3>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {detailModal.workRequest && 
                   detailModal.workRequest.status !== "deleted" &&
                   detailModal.workRequest.status !== "pending" && (
                    <button
                      type="button"
                      className={`btn danger btn_md`}
                      onClick={() => {
                        if (detailModal.workRequest?.id) {
                          handleDelete(detailModal.workRequest.id);
                        }
                      }}
                      disabled={deletingRequestId === detailModal.workRequest?.id}
                      style={{ marginRight: "8px" }}
                    >
                      {deletingRequestId === detailModal.workRequest?.id
                        ? "삭제 중..."
                        : "삭제"}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.detailModalClose}
                    onClick={handleCloseDetailModal}
                  >
                    ×
                  </button>
                </div>
              </div>
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
                                -
                              </div>
                            </li>
                          </ul>
                          <ul className={styles.tableRow}>
                            <li className={styles.rowGroup}>
                              <div className={styles.tableHead}>잔여 금액</div>
                              <div
                                className={`${styles.tableData} ${styles.fontB}`}
                              >
                                -
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
                              세부 내용 (잔여)
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
                              ? `${formatDate(
                                  detailModal.workRequest.managed_client
                                    .startDate
                                )} ~ ${formatDate(
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
                    </ul>
                    <ul className={styles.tableRow}>
                      <li className={styles.rowGroup}>
                        <div className={styles.tableHead}>요청일</div>
                        <div className={styles.tableData}>
                          {formatDate(detailModal.workRequest.created_at)}
                        </div>
                      </li>
                      <li className={styles.rowGroup}>
                        <div className={styles.tableHead}>승인일</div>
                        <div className={styles.tableData}>
                          {formatDate(
                            (detailModal.workRequest as any).approved_at
                          )}
                        </div>
                      </li>
                    </ul>
                    <ul className={styles.tableRow}>
                      <li className={styles.rowGroup}>
                        <div className={styles.tableHead}>상태변경일</div>
                        <div className={styles.tableData}>
                          {formatDate(detailModal.workRequest.updated_at)}
                        </div>
                      </li>
                      <li className={styles.rowGroup}>
                        <div className={styles.tableHead}>작업기간</div>
                        <div className={styles.tableData}>
                          {formatWorkPeriod(
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
                              {(detailModal.workRequest as any).cost
                                ? Number(
                                    (detailModal.workRequest as any).cost
                                  ).toLocaleString()
                                : "-"}
                            </div>
                          </li>
                          <li className={styles.rowGroup}>
                            <div className={styles.tableHead}>승인날짜</div>
                            <div
                              className={`${styles.tableData} ${styles.column}`}
                            >
                              {(detailModal.workRequest as any).approved_at
                                ? formatDate(
                                    (detailModal.workRequest as any).approved_at
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
                                  width={24}
                                  height={24}
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
                              {(detailModal.workRequest as any).approved_at
                                ? formatDate(
                                    (detailModal.workRequest as any).approved_at
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
                                  width={24}
                                  height={24}
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
                              {(detailModal.workRequest as any).count || "-"}
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
                onClick={() => {
                  alert("삭제 기능은 추후 구현 예정입니다.");
                }}
              >
                삭제
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnLg} ${styles.primary}`}
                onClick={() => {
                  alert("수정 기능은 추후 구현 예정입니다.");
                }}
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
