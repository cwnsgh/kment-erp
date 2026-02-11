"use client";

import { useState, useEffect, useMemo } from "react";
import { getContracts } from "@/app/actions/contract";
import styles from "./contract-table.module.css";

type ContractRow = {
  id: string;
  contract_date: string;
  contract_name: string;
  client_name: string;
  brand_name: string;
  payment_progress: string;
  contract_type_name: string;
  contract_amount: number;
  installment_amount: number | null;
  primary_contact_name: string | null;
};

type ContractTableProps = {
  initialContracts: ContractRow[];
};

// 진행상태 매핑
const mapPaymentProgress = (progress: string): "정상" | "미납" => {
  const progressMap: Record<string, "정상" | "미납"> = {
    paid: "정상",
    installment: "정상",
    unpaid: "미납",
  };
  return progressMap[progress] || "미납";
};

// 금액 포맷팅
const formatAmount = (amount: number | null): string => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("ko-KR").format(amount);
};

// 잔금 계산 (계약금액 - 분납금액)
const calculateRemaining = (contractAmount: number, installmentAmount: number | null, paymentProgress: string): number => {
  if (paymentProgress === "paid") return 0;
  if (paymentProgress === "unpaid") return contractAmount;
  if (paymentProgress === "installment" && installmentAmount) {
    return contractAmount - installmentAmount;
  }
  return contractAmount;
};

export function ContractTable({ initialContracts }: ContractTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentProgressFilter, setPaymentProgressFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [contractDateFrom, setContractDateFrom] = useState("");
  const [contractDateTo, setContractDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<ContractRow[]>(initialContracts);

  // initialContracts가 변경되면 contracts도 업데이트
  useEffect(() => {
    setContracts(initialContracts);
  }, [initialContracts]);

  // 검색 및 필터링
  const handleSearch = async () => {
    setLoading(true);
    const result = await getContracts({
      searchKeyword: searchQuery || undefined,
      paymentProgress: paymentProgressFilter === "all" ? undefined : paymentProgressFilter,
      contractDateFrom: contractDateFrom || undefined,
      contractDateTo: contractDateTo || undefined,
    });

    if (result.success && result.contracts) {
      setContracts(result.contracts);
      setCurrentPage(1);
    } else {
      alert(result.error || "계약 조회에 실패했습니다.");
    }
    setLoading(false);
  };

  // 초기화
  const handleReset = async () => {
    setSearchQuery("");
    setPaymentProgressFilter("all");
    setContractDateFrom("");
    setContractDateTo("");
    setLoading(true);
    const result = await getContracts();
    if (result.success && result.contracts) {
      setContracts(result.contracts);
      setCurrentPage(1);
    }
    setLoading(false);
  };

  const totalItems = contracts.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContracts = contracts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleSelectAll = () => {
    if (selectedRows.size === currentContracts.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(currentContracts.map((c) => c.id)));
    }
  };

  const handleRowSelect = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  return (
    <div className={`${styles.contractTable} white_box`}>
      {/* 검색 및 필터 섹션 */}
      <div className={styles.searchSection}>
        <div className={styles.searchRow}>
          <div className={styles.searchItem}>
            <label className={styles.searchLabel}>검색분류</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="계약명, 회사명, 브랜드명 검색"
              className={styles.searchInput}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>
          <div className={styles.searchItem}>
            <label className={styles.searchLabel}>진행상태</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="paymentProgress"
                  checked={paymentProgressFilter === "all"}
                  onChange={() => setPaymentProgressFilter("all")}
                />
                전체
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="paymentProgress"
                  checked={paymentProgressFilter === "paid"}
                  onChange={() => setPaymentProgressFilter("paid")}
                />
                정상
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="paymentProgress"
                  checked={paymentProgressFilter === "unpaid"}
                  onChange={() => setPaymentProgressFilter("unpaid")}
                />
                미납
              </label>
            </div>
          </div>
          <div className={styles.searchItem}>
            <label className={styles.searchLabel}>계약일</label>
            <div className={styles.dateRange}>
              <input
                type="date"
                value={contractDateFrom}
                onChange={(e) => setContractDateFrom(e.target.value)}
                className={styles.dateInput}
              />
              <span>~</span>
              <input
                type="date"
                value={contractDateTo}
                onChange={(e) => setContractDateTo(e.target.value)}
                className={styles.dateInput}
              />
            </div>
          </div>
          <div className={styles.searchButtons}>
            <button type="button" onClick={handleSearch} className="btn btn_md primary" disabled={loading}>
              검색
            </button>
            <button type="button" onClick={handleReset} className="btn btn_md normal" disabled={loading}>
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* 결과 요약 및 액션 */}
      <div className={styles.tableHeader}>
        <div className={styles.resultSummary}>
          총 {totalItems}건의 계약이 조회되었습니다.
        </div>
        <div className={styles.tableActions}>
          <button type="button" onClick={handleSelectAll} className="btn btn_sm normal">
            전체 선택
          </button>
          {selectedRows.size > 0 && (
            <button type="button" className="btn btn_sm primary">
              선택 삭제
            </button>
          )}
          <button type="button" className="btn btn_sm success">
            엑셀다운로드
          </button>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className={styles.pageSizeSelect}>
            <option value={10}>10개씩보기</option>
            <option value={20}>20개씩보기</option>
            <option value={50}>50개씩보기</option>
            <option value={100}>100개씩보기</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedRows.size === currentContracts.length && currentContracts.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>계약일</th>
              <th>회사명</th>
              <th>브랜드</th>
              <th>계약명</th>
              <th>진행상태</th>
              <th>계약종목</th>
              <th>계약금액 (잔금)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                  로딩 중...
                </td>
              </tr>
            ) : currentContracts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                  조회된 계약이 없습니다.
                </td>
              </tr>
            ) : (
              currentContracts.map((contract) => {
                const progress = mapPaymentProgress(contract.payment_progress);
                const remaining = calculateRemaining(
                  contract.contract_amount,
                  contract.installment_amount,
                  contract.payment_progress
                );
                return (
                  <tr key={contract.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(contract.id)}
                        onChange={() => handleRowSelect(contract.id)}
                      />
                    </td>
                    <td>{formatDate(contract.contract_date)}</td>
                    <td>{contract.client_name}</td>
                    <td>{contract.brand_name}</td>
                    <td>{contract.contract_name}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          progress === "정상" ? styles.statusNormal : styles.statusUnpaid
                        }`}>
                        {progress}
                      </span>
                    </td>
                    <td>{contract.contract_type_name}</td>
                    <td>
                      {formatAmount(contract.contract_amount)} ({formatAmount(remaining)})
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={styles.pageButton}>
            &lt;&lt;
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.pageButton}>
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`${styles.pageButton} ${currentPage === page ? styles.pageButtonActive : ""}`}>
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.pageButton}>
            &gt;
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={styles.pageButton}>
            &gt;&gt;
          </button>
        </div>
      )}
    </div>
  );
}
