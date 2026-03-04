"use client";

import { useState, useEffect, FormEvent } from "react";
import { getContracts, getContractDetail } from "@/app/actions/contract";
import { ContractDetailPanel, type ContractDetailData } from "./contract-detail-panel";
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

const mapPaymentProgress = (progress: string): "정상" | "미납" => {
  const progressMap: Record<string, "정상" | "미납"> = {
    paid: "정상",
    installment: "정상",
    unpaid: "미납",
  };
  return progressMap[progress] || "미납";
};

const formatAmount = (amount: number | null): string => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("ko-KR").format(amount);
};

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
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<ContractDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setContracts(initialContracts);
  }, [initialContracts]);

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
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
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const openDetail = async (contractId: string) => {
    setDetailOpen(true);
    setDetailData(null);
    setDetailLoading(true);
    const result = await getContractDetail(contractId);
    setDetailLoading(false);
    if (result.success && result.detail) {
      setDetailData(result.detail);
    } else {
      alert(result.error ?? "계약 상세를 불러올 수 없습니다.");
      setDetailOpen(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className={styles.contractList}>
      {/* 검색 영역 - 관리고객 조회와 동일 구조 */}
      <div className={`${styles.searchBox} search_box table_group`}>
        <div className={styles.tableItem}>
          <ul className={styles.tableRow}>
            <li className={styles.rowGroup}>
              <div className={styles.tableHead}>검색분류</div>
              <div className={`${styles.tableData} ${styles.pd12}`}>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="계약명, 회사명, 브랜드명 검색" className={styles.searchInput} />
              </div>
            </li>
            <li className={styles.rowGroup}>
              <div className={styles.tableHead}>진행상태</div>
              <div className={styles.tableData}>
                <input type="radio" id="contract_progress_all" name="contract_progress" checked={paymentProgressFilter === "all"} onChange={() => setPaymentProgressFilter("all")} />
                <label htmlFor="contract_progress_all">전체</label>
                <input type="radio" id="contract_progress_paid" name="contract_progress" checked={paymentProgressFilter === "paid"} onChange={() => setPaymentProgressFilter("paid")} />
                <label htmlFor="contract_progress_paid">정상</label>
                <input type="radio" id="contract_progress_unpaid" name="contract_progress" checked={paymentProgressFilter === "unpaid"} onChange={() => setPaymentProgressFilter("unpaid")} />
                <label htmlFor="contract_progress_unpaid">미납</label>
              </div>
            </li>
            <li className={styles.rowGroup}>
              <div className={styles.tableHead}>계약일</div>
              <div className={`${styles.tableData} ${styles.pd12}`}>
                <div className={styles.dateGroup}>
                  <input type="date" id="contract-date-from" value={contractDateFrom} onChange={(e) => setContractDateFrom(e.target.value)} className={styles.dateInput} />
                  <label
                    htmlFor="contract-date-from"
                    onClick={(e) => {
                      e.preventDefault();
                      (document.getElementById("contract-date-from") as HTMLInputElement)?.showPicker?.();
                    }}>
                    <img src="/images/date_icon.svg" alt="날짜" width={24} height={24} style={{ width: 24, height: 24, display: "block" }} />
                  </label>
                  <span>~</span>
                  <input type="date" id="contract-date-to" value={contractDateTo} onChange={(e) => setContractDateTo(e.target.value)} className={styles.dateInput} />
                  <label
                    htmlFor="contract-date-to"
                    onClick={(e) => {
                      e.preventDefault();
                      (document.getElementById("contract-date-to") as HTMLInputElement)?.showPicker?.();
                    }}>
                    <img src="/images/date_icon.svg" alt="날짜" width={24} height={24} style={{ width: 24, height: 24, display: "block" }} />
                  </label>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div className={styles.btnWrap}>
          <button type="button" className="btn btn_lg primary" onClick={() => handleSearch()} disabled={loading}>
            검색
          </button>
          <button type="button" className="btn btn_lg normal" onClick={handleReset} disabled={loading}>
            초기화
          </button>
        </div>
      </div>

      {/* 리스트 테이블 영역 */}
      <div className={styles.listTable}>
        <div className={styles.tableTop}>
          <div className={styles.topTotal}>
            <p>
              총 <span>{totalItems}</span>건의 계약이 조회되었습니다.
            </p>
          </div>
          <div className={styles.topBtnGroup}>
            <div className={`${styles.deleteBtn} ${showDeleteMenu ? styles.show : ""}`} onMouseEnter={() => setShowDeleteMenu(true)} onMouseLeave={() => setShowDeleteMenu(false)}>
              <button type="button" className="btn primary btn_md" id="contractDeleteClick" onClick={() => setShowDeleteMenu(!showDeleteMenu)}>
                삭제
              </button>
              <ul className={styles.deleteGroup}>
                <li>
                  <button
                    type="button"
                    className="btn normal btn_md"
                    onClick={() => {
                      handleSelectAll();
                      setShowDeleteMenu(false);
                    }}>
                    전체 선택
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="btn primary btn_md"
                    onClick={() => {
                      setShowDeleteMenu(false);
                    }}
                    disabled={selectedRows.size === 0}>
                    선택 삭제
                  </button>
                </li>
              </ul>
            </div>
            <button type="button" className={`${styles.excelBtn} btn btn_md normal`}>
              엑셀다운로드
            </button>
            <select
              className={`viewSelect`}
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}>
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
              <col style={{ width: "10%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" id="contractCheckAll" checked={currentContracts.length > 0 && selectedRows.size === currentContracts.length} onChange={handleSelectAll} />
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
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px 0" }}>
                    로딩 중...
                  </td>
                </tr>
              ) : currentContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px 0" }}>
                    조회된 계약이 없습니다.
                  </td>
                </tr>
              ) : (
                currentContracts.map((contract) => {
                  const progress = mapPaymentProgress(contract.payment_progress);
                  const remaining = calculateRemaining(contract.contract_amount, contract.installment_amount, contract.payment_progress);
                  return (
                    <tr
                      key={contract.id}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest("input[type=checkbox]")) return;
                        openDetail(contract.id);
                      }}
                      style={{ cursor: "pointer" }}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedRows.has(contract.id)} onChange={() => handleRowSelect(contract.id)} />
                      </td>
                      <td>{formatDate(contract.contract_date)}</td>
                      <td>{contract.client_name}</td>
                      <td>{contract.brand_name}</td>
                      <td>{contract.contract_name}</td>
                      <td>
                        <span className={progress === "정상" ? `${styles.statusBadge} ${styles.statusNormal}` : `${styles.statusBadge} ${styles.statusUnpaid}`}>{progress}</span>
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
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className={`${styles.pagination} pagination`}>
          <ul>
            <li className={`${styles.page} ${styles.first} ${currentPage === 1 ? styles.disabled : ""}`} style={{ cursor: currentPage === 1 ? "not-allowed" : "pointer" }} onClick={() => currentPage !== 1 && setCurrentPage(1)} />
            <li className={`${styles.page} ${styles.prev} ${currentPage === 1 ? styles.disabled : ""}`} style={{ cursor: currentPage === 1 ? "not-allowed" : "pointer" }} onClick={() => currentPage !== 1 && setCurrentPage(currentPage - 1)} />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li key={page} className={`${styles.page} ${currentPage === page ? styles.active : ""}`} style={{ cursor: "pointer" }} onClick={() => setCurrentPage(page)}>
                {page}
              </li>
            ))}
            <li className={`${styles.page} ${styles.next} ${currentPage === totalPages ? styles.disabled : ""}`} style={{ cursor: currentPage === totalPages ? "not-allowed" : "pointer" }} onClick={() => currentPage !== totalPages && setCurrentPage(currentPage + 1)} />
            <li className={`${styles.page} ${styles.last} ${currentPage === totalPages ? styles.disabled : ""}`} style={{ cursor: currentPage === totalPages ? "not-allowed" : "pointer" }} onClick={() => currentPage !== totalPages && setCurrentPage(totalPages)} />
          </ul>
        </div>
      )}

      <ContractDetailPanel isOpen={detailOpen} onClose={() => setDetailOpen(false)} detail={detailData} isLoading={detailLoading} />
    </div>
  );
}
