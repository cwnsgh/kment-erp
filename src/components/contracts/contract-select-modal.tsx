"use client";

import { useState, useEffect } from "react";
import { getContracts } from "@/app/actions/contract";
import styles from "./contract-select-modal.module.css";

type ContractRow = {
  id: string;
  contract_name: string;
  client_name: string;
  brand_name: string;
  contract_date: string;
};

type ContractSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contractId: string) => void;
};

export function ContractSelectModal({ isOpen, onClose, onSelect }: ContractSelectModalProps) {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadContracts();
    }
  }, [isOpen]);

  const loadContracts = async () => {
    setIsLoading(true);
    setError("");
    const result = await getContracts({
      searchKeyword: searchKeyword || undefined,
    });
    if (result.success && result.contracts) {
      setContracts(
        result.contracts.map((c: any) => ({
          id: c.id,
          contract_name: c.contract_name,
          client_name: c.client_name,
          brand_name: c.brand_name,
          contract_date: c.contract_date,
        })),
      );
    } else {
      setError(result.error || "계약 목록을 불러올 수 없습니다.");
      setContracts([]);
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadContracts();
  };

  const handleSelect = (contractId: string) => {
    onSelect(contractId);
    onClose();
  };

  const formatDate = (d: string) => {
    if (!d) return "-";
    const date = new Date(d);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalInner} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>계약 불러오기</h3>
          <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="닫기" />
        </div>
        <div className={styles.searchBox}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input type="text" placeholder="계약명 검색" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className={styles.searchInput} />
            <button type="submit" className="btn btn_lg primary">
              검색
            </button>
          </form>
        </div>
        <div className={`${styles.tableWrap} scroll`}>
          {error && <p className={styles.error}>{error}</p>}
          {isLoading ? (
            <p className={styles.loading}>로딩 중...</p>
          ) : (
            <>
              <p className={styles.total}>
                총 <span>{contracts.length}건</span>의 계약이 조회되었습니다.
              </p>
              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th>계약명</th>
                    <th>거래처</th>
                    <th>브랜드</th>
                    <th>계약일</th>
                    <th>선택</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr key={c.id} onClick={() => handleSelect(c.id)} className={styles.selectRow}>
                      <td>{c.contract_name}</td>
                      <td>{c.client_name}</td>
                      <td>{c.brand_name}</td>
                      <td>{formatDate(c.contract_date)}</td>
                      <td>
                        <button type="button" className="btn btn_md primary">
                          선택
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
