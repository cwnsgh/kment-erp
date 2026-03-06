"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  getConsultations,
  getConsultationDetail,
  deleteConsultations,
  type ConsultationDetail,
  type ConsultationListItem,
} from "@/app/actions/consultation";
import { ConsultationDetailModal } from "./consultation-detail-modal";
import styles from "./consultation-table.module.css";

type ConsultationTableProps = {
  initialList: ConsultationListItem[];
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function ConsultationTable({ initialList }: ConsultationTableProps) {
  const [list, setList] = useState<ConsultationListItem[]>(initialList);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [detail, setDetail] = useState<ConsultationDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  useEffect(() => {
    setList(initialList);
  }, [initialList]);

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setListLoading(true);
    const result = await getConsultations({
      searchKeyword: searchKeyword.trim() || undefined,
      consultationDateFrom: dateFrom || undefined,
      consultationDateTo: dateTo || undefined,
    });
    setListLoading(false);
    if (result.success && result.data) {
      setList(result.data);
      setCurrentPage(1);
      setSelectedIds(new Set());
    } else {
      alert(result.error ?? "상담 목록 조회에 실패했습니다.");
    }
  };

  const handleReset = async () => {
    setSearchKeyword("");
    setDateFrom("");
    setDateTo("");
    setListLoading(true);
    const result = await getConsultations();
    setListLoading(false);
    if (result.success && result.data) {
      setList(result.data);
      setCurrentPage(1);
      setSelectedIds(new Set());
    }
  };

  const handleRowClick = async (id: string) => {
    setDetailLoading(true);
    setIsModalOpen(true);
    setDetail(null);
    const result = await getConsultationDetail(id);
    setDetailLoading(false);
    if (result.success && result.data) {
      setDetail(result.data);
    } else {
      alert(result.error ?? "상담 정보를 불러오는데 실패했습니다.");
      setIsModalOpen(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === currentItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentItems.map((r) => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}건의 상담을 삭제하시겠습니까?`)) return;
    const result = await deleteConsultations(ids);
    setShowDeleteMenu(false);
    if (result.success) {
      setList((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
    } else {
      alert(result.error ?? "삭제에 실패했습니다.");
    }
  };

  const totalItems = list.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = list.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <div className={styles.consultationList}>
      {/* 검색 영역 - 계약조회와 동일 구조 */}
      <div className={`${styles.searchBox} search_box table_group`}>
        <div className={styles.tableItem}>
          <ul className={styles.tableRow}>
            <li className={styles.rowGroup}>
              <div className={styles.tableHead}>검색분류</div>
              <div className={`${styles.tableData} ${styles.pd12}`}>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="상호, 업종, 브랜드 검색"
                  className={styles.searchInput}
                />
              </div>
            </li>
            <li className={styles.rowGroup}>
              <div className={styles.tableHead}>상담일</div>
              <div className={`${styles.tableData} ${styles.pd12}`}>
                <div className={styles.dateGroup}>
                  <input
                    type="date"
                    id="consultation-date-from"
                    className={styles.dateInput}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <label
                    htmlFor="consultation-date-from"
                    onClick={(e) => {
                      e.preventDefault();
                      (document.getElementById("consultation-date-from") as HTMLInputElement)?.showPicker?.();
                    }}>
                    <img src="/images/date_icon.svg" alt="날짜" width={16} height={16} style={{ width: 16, height: 16, display: "block" }} />
                  </label>
                  <span>~</span>
                  <input
                    type="date"
                    id="consultation-date-to"
                    className={styles.dateInput}
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                  <label
                    htmlFor="consultation-date-to"
                    onClick={(e) => {
                      e.preventDefault();
                      (document.getElementById("consultation-date-to") as HTMLInputElement)?.showPicker?.();
                    }}>
                    <img src="/images/date_icon.svg" alt="날짜" width={16} height={16} style={{ width: 16, height: 16, display: "block" }} />
                  </label>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div className={styles.btnWrap}>
          <button type="button" className="btn btn_lg primary" onClick={() => handleSearch()} disabled={listLoading}>
            검색
          </button>
          <button type="button" className="btn btn_lg normal" onClick={handleReset} disabled={listLoading}>
            초기화
          </button>
        </div>
      </div>

      <div className={styles.listTable}>
        <div className={styles.tableTop}>
          <div className={styles.topTotal}>
            <p>
              총 <span>{totalItems}</span>건의 상담이 조회되었습니다.
            </p>
          </div>
          <div className={styles.topBtnGroup}>
            <div
              className={`${styles.deleteBtn} ${showDeleteMenu ? styles.show : ""}`}
              onMouseEnter={() => setShowDeleteMenu(true)}
              onMouseLeave={() => setShowDeleteMenu(false)}
            >
              <button type="button" className="btn primary btn_md" onClick={() => setShowDeleteMenu(!showDeleteMenu)}>
                삭제
              </button>
              <ul className={styles.deleteGroup}>
                <li>
                  <button type="button" className="btn normal btn_md" onClick={() => (handleSelectAll(), setShowDeleteMenu(false))}>
                    전체 선택
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="btn primary btn_md"
                    onClick={() => handleBulkDelete()}
                    disabled={selectedIds.size === 0}
                  >
                    선택 삭제
                  </button>
                </li>
              </ul>
            </div>
            <select
              className={styles.viewSelect}
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10개씩 보기</option>
              <option value={20}>20개씩 보기</option>
              <option value={50}>50개씩 보기</option>
              <option value={100}>100개씩 보기</option>
            </select>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={currentItems.length > 0 && selectedIds.size === currentItems.length}
                    onChange={handleSelectAll}
                    aria-label="전체 선택"
                  />
                </th>
                <th>회사명</th>
                <th>업종</th>
                <th>브랜드</th>
                <th>구분</th>
                <th>상담일자</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    로딩 중...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    조회된 상담이 없습니다.
                  </td>
                </tr>
              ) : (
                currentItems.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), handleRowClick(row.id))}
                    role="button"
                    tabIndex={0}
                    className={styles.clickableRow}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(row.id)) next.delete(row.id);
                          else next.add(row.id);
                          setSelectedIds(next);
                        }}
                        aria-label={`${row.company_name} 선택`}
                      />
                    </td>
                    <td>{row.company_name || "-"}</td>
                    <td>{row.industry || "-"}</td>
                    <td>{row.brand || "-"}</td>
                    <td>{row.category_names?.length ? row.category_names.join(", ") : "-"}</td>
                    <td>{formatDate(row.consultation_date)}</td>
                    <td>{formatDate(row.created_at)}</td>
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
            <li
              className={`${styles.page} ${styles.first} ${currentPage === 1 ? styles.disabled : ""}`}
              style={{ cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
              onClick={() => currentPage !== 1 && setCurrentPage(1)}
            />
            <li
              className={`${styles.page} ${styles.prev} ${currentPage === 1 ? styles.disabled : ""}`}
              style={{ cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
              onClick={() => currentPage !== 1 && setCurrentPage(currentPage - 1)}
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li
                key={page}
                className={`${styles.page} ${currentPage === page ? styles.active : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </li>
            ))}
            <li
              className={`${styles.page} ${styles.next} ${currentPage === totalPages ? styles.disabled : ""}`}
              style={{ cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
              onClick={() => currentPage !== totalPages && setCurrentPage(currentPage + 1)}
            />
            <li
              className={`${styles.page} ${styles.last} ${currentPage === totalPages ? styles.disabled : ""}`}
              style={{ cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
              onClick={() => currentPage !== totalPages && setCurrentPage(totalPages)}
            />
          </ul>
        </div>
      )}

      <ConsultationDetailModal
        detail={detail}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isLoading={detailLoading}
        onDeleted={(id) => setList((prev) => prev.filter((r) => r.id !== id))}
      />
    </div>
  );
}
