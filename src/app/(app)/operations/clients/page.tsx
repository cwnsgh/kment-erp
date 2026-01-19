"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getManagedClients,
  deleteManagedClients,
} from "@/app/actions/managed-client";
import { buildExcelFilename, downloadExcel } from "@/lib/excel-download";
import styles from "./page.module.css";

type ManagedClient = {
  id: string;
  clientId: string;
  companyName: string;
  brandNames: string[];
  productType1: "deduct" | "maintenance";
  productType2: string;
  totalAmount: number | null;
  paymentStatus: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string;
};

export default function ManagedClientListPage() {
  const router = useRouter();
  const [managedClients, setManagedClients] = useState<ManagedClient[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 검색 필터 상태
  const [searchKeyword, setSearchKeyword] = useState("");
  const [productType1, setProductType1] = useState<
    "deduct" | "maintenance" | ""
  >("");
  const [status, setStatus] = useState<
    "ongoing" | "wait" | "end" | "unpaid" | ""
  >("");
  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const handleExcelDownload = () => {
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set("searchKeyword", searchKeyword.trim());
    if (productType1) params.set("productType1", productType1);
    if (status) params.set("status", status);
    if (startDateFrom) params.set("startDateFrom", startDateFrom);
    if (startDateTo) params.set("startDateTo", startDateTo);

    downloadExcel(
      `/api/operations/clients/export?${params.toString()}`,
      buildExcelFilename("관리고객-목록")
    );
  };

  // 데이터 로드
  const loadData = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const result = await getManagedClients({
        page,
        limit: 20,
        searchKeyword: searchKeyword || undefined,
        productType1: productType1 || undefined,
        status: status || undefined,
        startDateFrom: startDateFrom || undefined,
        startDateTo: startDateTo || undefined,
      });

      if (result.success) {
        setManagedClients(result.managedClients);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
        setCurrentPage(page);
        console.log("관리고객 목록 로드 성공:", {
          count: result.totalCount,
          items: result.managedClients.length,
        });
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

  // 초기 로드 (페이지 첫 진입 시에만)
  useEffect(() => {
    loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열로 초기 로드만 실행

  // 검색 핸들러 (검색 버튼 클릭 시에만 호출)
  const handleSearch = (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    loadData(1);
  };

  // 체크박스 토글
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(managedClients.map((mc) => mc.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedIds.length}개의 항목을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await deleteManagedClients(selectedIds);
      if (result.success) {
        alert("삭제되었습니다.");
        setSelectedIds([]);
        loadData(currentPage);
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 관리유형 표시 포맷
  const formatProductType = (type1: string, type2: string) => {
    if (type1 === "deduct") {
      return `금액차감형(${type2.toUpperCase()})`;
    } else if (type1 === "maintenance") {
      const type2Label = type2 === "standard" ? "S" : "P";
      return `유지보수형(${type2Label})`;
    }
    return "";
  };

  // 날짜 포맷
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  // 진행상황 표시
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      ongoing: "진행",
      wait: "대기",
      end: "종료",
      unpaid: "미납",
    };
    return statusMap[status] || status;
  };

  // 진행상황 스타일
  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      ongoing: styles.statusOngoing,
      wait: styles.statusWait,
      end: styles.statusEnd,
      unpaid: styles.statusUnpaid,
    };
    return classMap[status] || "";
  };

  return (
    <section
      className={`${styles.manageClientList} manageClient_list page_section`}
    >
      <div className="page_title">
        <h1>관리 고객 조회</h1>
      </div>
      <div className={styles.whiteBox}>
        <div className={styles.boxInner}>
          {/* 검색 영역 */}
          <div className={`${styles.searchBox} search_box table_group`}>
            <div className={styles.tableItem}>
              <ul className={styles.tableRow}>
                <li className={styles.rowGroup}>
                  <div className={styles.tableHead}>회사명(브랜드명)</div>
                  <div className={`${styles.tableData} ${styles.pd12}`}>
                    <input
                      type="text"
                      name="search_name"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder=""
                      className={styles.searchInput}
                    />
                  </div>
                </li>
                <li className={styles.rowGroup}>
                  <div className={styles.tableHead}>관리유형</div>
                  <div className={styles.tableData}>
                    <input
                      type="radio"
                      id="search_type_deduct"
                      name="search_type1"
                      value="deduct"
                      checked={productType1 === "deduct"}
                      onChange={(e) => setProductType1("deduct")}
                    />
                    <label htmlFor="search_type_deduct">금액차감형</label>

                    <input
                      type="radio"
                      id="search_type_maintenance"
                      name="search_type1"
                      value="maintenance"
                      checked={productType1 === "maintenance"}
                      onChange={(e) => setProductType1("maintenance")}
                    />
                    <label htmlFor="search_type_maintenance">유지보수형</label>
                  </div>
                </li>
                <li className={styles.rowGroup}>
                  <div className={styles.tableHead}>진행 상황</div>
                  <div className={styles.tableData}>
                    <input
                      type="radio"
                      id="search_type_all"
                      name="search_type2"
                      value="all"
                      checked={status === ""}
                      onChange={(e) => setStatus("")}
                    />
                    <label htmlFor="search_type_all">전체</label>

                    <input
                      type="radio"
                      id="search_type_ongoing"
                      name="search_type2"
                      value="ongoing"
                      checked={status === "ongoing"}
                      onChange={(e) => setStatus("ongoing")}
                    />
                    <label htmlFor="search_type_ongoing">진행</label>

                    <input
                      type="radio"
                      id="search_type_wait"
                      name="search_type2"
                      value="wait"
                      checked={status === "wait"}
                      onChange={(e) => setStatus("wait")}
                    />
                    <label htmlFor="search_type_wait">대기</label>

                    <input
                      type="radio"
                      id="search_type_unpaid"
                      name="search_type2"
                      value="unpaid"
                      checked={status === "unpaid"}
                      onChange={(e) => setStatus("unpaid")}
                    />
                    <label htmlFor="search_type_unpaid">미납</label>

                    <input
                      type="radio"
                      id="search_type_end"
                      name="search_type2"
                      value="end"
                      checked={status === "end"}
                      onChange={(e) => setStatus("end")}
                    />
                    <label htmlFor="search_type_end">종료</label>
                  </div>
                </li>
                <li className={styles.rowGroup}>
                  <div className={styles.tableHead}>시작일</div>
                  <div className={`${styles.tableData} ${styles.pd12}`}>
                    <form action="#" method="get" className={styles.dateGroup}>
                      <input
                        type="date"
                        id="start-date"
                        name="start-date"
                        value={startDateFrom}
                        onChange={(e) => setStartDateFrom(e.target.value)}
                        className={styles.dateInput}
                      />
                      <label
                        htmlFor="start-date"
                        onClick={(e) => {
                          e.preventDefault();
                          const input = document.getElementById(
                            "start-date"
                          ) as HTMLInputElement | null;
                          if (input && input.type === "date") {
                            try {
                              // showPicker는 최신 브라우저에서 지원
                              (input as any).showPicker?.();
                            } catch {
                              // showPicker를 지원하지 않는 경우 click으로 대체
                              input.click();
                            }
                          }
                        }}
                      >
                        <img
                          src="/images/date_icon.svg"
                          alt="날짜"
                          style={{
                            width: "24px",
                            height: "24px",
                            display: "block",
                          }}
                        />
                      </label>
                      <span>~</span>
                      <input
                        type="date"
                        id="end-date"
                        name="end-date"
                        value={startDateTo}
                        onChange={(e) => setStartDateTo(e.target.value)}
                        className={styles.dateInput}
                      />
                      <label
                        htmlFor="end-date"
                        onClick={(e) => {
                          e.preventDefault();
                          const input = document.getElementById(
                            "end-date"
                          ) as HTMLInputElement | null;
                          if (input && input.type === "date") {
                            try {
                              // showPicker는 최신 브라우저에서 지원
                              (input as any).showPicker?.();
                            } catch {
                              // showPicker를 지원하지 않는 경우 click으로 대체
                              input.click();
                            }
                          }
                        }}
                      >
                        <img
                          src="/images/date_icon.svg"
                          alt="날짜"
                          style={{
                            width: "24px",
                            height: "24px",
                            display: "block",
                          }}
                        />
                      </label>
                    </form>
                  </div>
                </li>
              </ul>
            </div>
            <div className={styles.btnWrap}>
              <button
                type="button"
                className="btn btn_lg primary"
                onClick={handleSearch}
              >
                검색
              </button>
              <button
                type="button"
                className="btn btn_lg normal"
                onClick={() => {
                  setSearchKeyword("");
                  setProductType1("");
                  setStatus("");
                  setStartDateFrom("");
                  setStartDateTo("");
                }}
              >
                초기화
              </button>
            </div>
          </div>

          {/* 리스트 테이블 영역 */}
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
                    className="btn primary btn_md"
                    id="deleteClick"
                    onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                  >
                    삭제
                  </button>
                  <ul className={styles.deleteGroup}>
                    <li>
                      <button
                        type="button"
                        className="btn normal btn_md"
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
                        className="btn primary btn_md"
                        onClick={() => {
                          handleDelete();
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
                  className={`${styles.excelBtn} btn btn_md normal`}
                  onClick={handleExcelDownload}
                >
                  엑셀다운로드
                </button>
                <select className={styles.viewSelect}>
                  <option value="view_10">10개씩 보기</option>
                  <option value="view_30">50개씩 보기</option>
                  <option value="view_50">100개씩 보기</option>
                  <option value="view_100">200개씩 보기</option>
                </select>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "auto" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        id="checkAll"
                        checked={
                          managedClients.length > 0 &&
                          selectedIds.length === managedClients.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>번호</th>
                    <th>회사명</th>
                    <th>브랜드명</th>
                    <th>관리유형</th>
                    <th>시작일(종료일)</th>
                    <th>진행상황</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{ textAlign: "center", padding: "30px 0" }}
                      >
                        로딩 중...
                      </td>
                    </tr>
                  ) : managedClients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{ textAlign: "center", padding: "30px 0" }}
                      >
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    managedClients.map((mc, index) => (
                      <tr key={mc.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="rowCheck"
                            checked={selectedIds.includes(mc.id)}
                            onChange={() => handleToggleSelect(mc.id)}
                          />
                        </td>
                        <td>{totalCount - (currentPage - 1) * 20 - index}</td>
                        <td>{mc.companyName}</td>
                        <td>{mc.brandNames.join(", ") || "-"}</td>
                        <td>
                          {formatProductType(mc.productType1, mc.productType2)}
                        </td>
                        <td>
                          {!mc.startDate && !mc.endDate
                            ? "-"
                            : `${formatDate(mc.startDate)}(${formatDate(
                                mc.endDate
                              )})`}
                        </td>
                        <td>
                          <span className={getStatusClass(mc.status)}>
                            {getStatusLabel(mc.status)}
                          </span>
                        </td>
                        <td>
                          <ul className="manageBtn">
                            <li>
                              <button
                                type="button"
                                className="btn normal"
                                onClick={() => {
                                  router.push(`/operations/clients/${mc.id}`);
                                }}
                              >
                                고객조회
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                className="btn normal"
                                onClick={() => {
                                  router.push(`/operations/clients/${mc.id}/tasks`);
                                }}
                              >
                                업무조회
                              </button>
                            </li>
                          </ul>
                        </td>
                      </tr>
                    ))
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
                style={{
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
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
                style={{
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
                onClick={() => {
                  if (currentPage !== 1) {
                    loadData(currentPage - 1);
                  }
                }}
              ></li>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <li
                    key={page}
                    className={`${styles.page} ${
                      currentPage === page ? styles.active : ""
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => loadData(page)}
                  >
                    {page}
                  </li>
                )
              )}

              <li
                className={`${styles.page} ${styles.next} ${
                  currentPage === totalPages ? styles.disabled : ""
                }`}
                style={{
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                }}
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
                style={{
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                }}
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
    </section>
  );
}
