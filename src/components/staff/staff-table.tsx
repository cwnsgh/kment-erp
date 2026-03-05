"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StaffListItem } from "@/app/actions/staff";
import { formatEmploymentStatus, formatPhoneDisplay } from "@/lib/staff-utils";
import styles from "./staff-table.module.css";

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

type StaffTableProps = {
  initialList: StaffListItem[];
  total: number;
  roleOptions: { id: number; name: string }[];
  page: number;
  pageSize: number;
  searchType: string;
  searchKeyword: string;
  /** URL 기준 경로 (검색/페이지네이션용). 기본값 "/staff". 직원관리 페이지는 "/staff/manage" */
  basePath?: string;
  /** 직원 행 클릭 시 호출 (직원관리 모달용). 있으면 이름이 링크 대신 클릭 영역으로 동작 */
  onRowClick?: (id: string) => void;
};

export function StaffTable({
  initialList,
  total,
  roleOptions,
  page,
  pageSize,
  searchType,
  searchKeyword,
  basePath = "/staff",
  onRowClick,
}: StaffTableProps) {
  const router = useRouter();
  const [searchTypeState, setSearchTypeState] = useState(searchType || "name");
  const [keywordState, setKeywordState] = useState(searchKeyword || "");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    if (searchTypeState) params.set("searchType", searchTypeState);
    if (keywordState.trim()) params.set("searchKeyword", keywordState.trim());
    router.push(`${basePath}?${params.toString()}`);
  };

  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(newPage));
    params.set("pageSize", String(pageSize));
    if (searchType) params.set("searchType", searchType);
    if (searchKeyword) params.set("searchKeyword", searchKeyword);
    return `${basePath}?${params.toString()}`;
  };

  const statusClass = (status: string | null) => {
    if (!status) return "";
    if (status === "employed") return styles.statusOngoing;
    if (status === "left") return styles.statusEnd;
    return styles.statusUnpaid;
  };

  return (
    <div className={styles.staffList}>
      <div className={styles.searchBox}>
        <form className={styles.searchFlex} onSubmit={handleSearch}>
          <select
            value={searchTypeState}
            onChange={(e) => setSearchTypeState(e.target.value)}
            className={styles.searchSelect}
          >
            <option value="name">사원명</option>
            <option value="grade">직급</option>
            <option value="work">담당업무</option>
          </select>
          {searchTypeState === "grade" ? (
            <select
              value={keywordState}
              onChange={(e) => setKeywordState(e.target.value)}
              className={styles.searchInput}
            >
              <option value="">선택</option>
              {roleOptions.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={keywordState}
              onChange={(e) => setKeywordState(e.target.value)}
              placeholder="검색어 입력"
              className={styles.searchInput}
            />
          )}
          <button type="submit" className="btn btn_lg primary">
            검색
          </button>
        </form>
      </div>

      <div className={styles.listTable}>
        <div className={styles.tableTop}>
          <div className={styles.topTotal}>
            <p>
              총 <span>{total}</span>건의 직원이 조회되었습니다.
            </p>
          </div>
          <div className={styles.topBtnGroup}>
            <select
              className={styles.viewSelect}
              value={pageSize}
              onChange={(e) => {
                const params = new URLSearchParams();
                params.set("page", "1");
                params.set("pageSize", e.target.value);
                if (searchType) params.set("searchType", searchType);
                if (searchKeyword) params.set("searchKeyword", searchKeyword);
                router.push(`${basePath}?${params.toString()}`);
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
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "auto" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>이름</th>
                <th>직급</th>
                <th>담당업무</th>
                <th>휴대폰 번호</th>
                <th>이메일</th>
                <th>입사일</th>
                <th>재직상태</th>
              </tr>
            </thead>
            <tbody>
              {initialList.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    조회된 직원이 없습니다.
                  </td>
                </tr>
              ) : (
                initialList.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onRowClick?.(row.id))}
                    role={onRowClick ? "button" : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={onRowClick ? styles.clickableRow : undefined}
                  >
                    <td>
                      {onRowClick ? (
                        <span className={styles.nameLink}>{row.name || "-"}</span>
                      ) : (
                        <Link href={`/staff/${row.id}/edit`} className={styles.nameLink}>
                          {row.name || "-"}
                        </Link>
                      )}
                    </td>
                    <td>{row.role_name ?? "-"}</td>
                    <td>{row.job_type ?? "-"}</td>
                    <td>{row.phone ? formatPhoneDisplay(row.phone) : "-"}</td>
                    <td>{row.contact_email ?? "-"}</td>
                    <td>{formatDate(row.join_date)}</td>
                    <td>
                      <span className={statusClass(row.employment_status)}>
                        {formatEmploymentStatus(row.employment_status)}
                      </span>
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
            <li>
              <Link
                href={page <= 1 ? "#" : buildPageUrl(1)}
                className={`${styles.page} ${styles.first} ${page <= 1 ? styles.disabled : ""}`}
                aria-disabled={page <= 1}
                onClick={(e) => page <= 1 && e.preventDefault()}
              />
            </li>
            <li>
              <Link
                href={page <= 1 ? "#" : buildPageUrl(page - 1)}
                className={`${styles.page} ${styles.prev} ${page <= 1 ? styles.disabled : ""}`}
                aria-disabled={page <= 1}
                onClick={(e) => page <= 1 && e.preventDefault()}
              />
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <li key={p}>
                <Link
                  href={buildPageUrl(p)}
                  className={`${styles.page} ${page === p ? styles.active : ""}`}
                >
                  {p}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={page >= totalPages ? "#" : buildPageUrl(page + 1)}
                className={`${styles.page} ${styles.next} ${page >= totalPages ? styles.disabled : ""}`}
                aria-disabled={page >= totalPages}
                onClick={(e) => page >= totalPages && e.preventDefault()}
              />
            </li>
            <li>
              <Link
                href={page >= totalPages ? "#" : buildPageUrl(totalPages)}
                className={`${styles.page} ${styles.last} ${page >= totalPages ? styles.disabled : ""}`}
                aria-disabled={page >= totalPages}
                onClick={(e) => page >= totalPages && e.preventDefault()}
              />
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
