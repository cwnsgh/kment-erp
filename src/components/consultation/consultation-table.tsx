"use client";

import { useState, useEffect } from "react";
import type { ConsultationListItem } from "@/app/actions/consultation";
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

  useEffect(() => {
    setList(initialList);
  }, [initialList]);

  const totalItems = list.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = list.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <div className={styles.consultationList}>
      <div className={styles.listTable}>
        <div className={styles.tableTop}>
          <div className={styles.topTotal}>
            <p>
              총 <span>{totalItems}</span>건의 상담이 조회되었습니다.
            </p>
          </div>
          <div className={styles.topBtnGroup}>
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
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>상호</th>
                <th>업종</th>
                <th>브랜드</th>
                <th>구분</th>
                <th>상담일자</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px 0" }}>
                    조회된 상담이 없습니다.
                  </td>
                </tr>
              ) : (
                currentItems.map((row) => (
                  <tr key={row.id}>
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
        <div className={`${styles.pagination} pagination`}>
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
    </div>
  );
}
