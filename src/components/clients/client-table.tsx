"use client";

import { Download, RefreshCw } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { ClientDetailModal } from "./client-detail-modal";
import { getClientDetail, refreshBusinessStatus, getClients } from "@/app/actions/client";
import { useRouter } from "next/navigation";
import { buildExcelFilename, downloadExcel } from "@/lib/excel-download";
import styles from "./client-table.module.css";

type ClientRow = {
  id: string;
  business_registration_number: string;
  name: string;
  ceo_name: string | null;
  status: string;
  created_at: string;
};

type ClientTableProps = {
  initialClients: ClientRow[];
};

type SearchType = "company" | "ceo" | "business_number";

// DB status를 UI status로 변환
const mapStatus = (status: string | null | undefined): "정상" | "휴업" | "폐업" | "확인불가" => {
  if (!status) {
    return "확인불가";
  }
  const statusMap: Record<string, "정상" | "휴업" | "폐업" | "확인불가"> = {
    approved: "정상",
    suspended: "휴업",
    closed: "폐업",
    unavailable: "확인불가",
    unknown: "확인불가",
  };
  return statusMap[status] || "확인불가";
};

// Status CSS 클래스 매핑
const getStatusClassName = (status: "정상" | "휴업" | "폐업" | "확인불가"): string => {
  const statusMap: Record<string, string> = {
    정상: styles.statusOngoing,
    휴업: styles.statusEnd,
    폐업: styles.statusUnpaid,
    확인불가: styles.statusEnd, // 확인불가는 휴업과 같은 스타일 사용
  };
  return statusMap[status] || styles.statusEnd;
};

export function ClientTable({ initialClients }: ClientTableProps) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientDetail, setSelectedClientDetail] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("company");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>(initialClients);

  // initialClients가 변경되면 clients도 업데이트
  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  // 검색 필터링
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) {
      return clients;
    }

    return clients.filter((client) => {
      const query = searchQuery.toLowerCase().trim();
      switch (searchType) {
        case "company":
          return client.name.toLowerCase().includes(query);
        case "ceo":
          return client.ceo_name?.toLowerCase().includes(query) || false;
        case "business_number":
          return client.business_registration_number.includes(query);
        default:
          return true;
      }
    });
  }, [clients, searchQuery, searchType]);

  const totalItems = filteredClients.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // 검색 시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchType]);

  const handleSelectAll = () => {
    if (selectedRows.size === currentClients.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(currentClients.map((c) => c.id)));
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

  const handleRowClick = async (clientId: string) => {
    setLoading(true);
    setSelectedClientId(clientId);
    const result = await getClientDetail(clientId);
    if (result.success && result.client) {
      setSelectedClientDetail(result.client);
      setIsModalOpen(true);
    } else {
      alert("거래처 정보를 불러오는데 실패했습니다.");
    }
    setLoading(false);
  };

  const handleExcelDownload = () => {
    const params = new URLSearchParams();
    params.set("searchType", searchType);
    if (searchQuery.trim()) {
      params.set("searchQuery", searchQuery.trim());
    }

    downloadExcel(
      `/api/clients/export?${params.toString()}`,
      buildExcelFilename("거래처-목록")
    );
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return;
    if (confirm(`선택한 ${selectedRows.size}건을 삭제하시겠습니까?`)) {
      setSelectedRows(new Set());
    }
  };

  // 전체 상태 새로고침
  const handleRefreshStatus = async () => {
    if (!confirm("전체 거래처의 상태를 새로고침하시겠습니까?")) {
      return;
    }

    setRefreshing(true);
    try {
      const result = await refreshBusinessStatus([]);

      if (result.success) {
        alert(
          result.message ||
            `총 ${result.updated}건의 상태가 업데이트되었습니다.`
        );
        // 클라이언트 목록 다시 로드
        const clientsResult = await getClients();
        if (clientsResult.success && clientsResult.clients) {
          setClients(clientsResult.clients);
        }
        // 페이지 새로고침
        router.refresh();
      } else {
        alert(`상태 새로고침 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("상태 새로고침 오류:", error);
      alert("상태 새로고침 중 오류가 발생했습니다.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={styles.clientTableWrapper}>
      <div className="white_box">
        <div className="box_inner">
          {/* 검색 필터 */}
          <div className={styles.searchBox}>
            <div className={styles.searchFlex}>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as SearchType)}
              >
                <option value="company">회사명</option>
                <option value="business_number">사업자 등록 번호</option>
                <option value="ceo">대표자명</option>
              </select>
              <input
                type="text"
                name="search_name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder=""
              />
              <button type="button" className="btn btn_lg primary">
                검색
              </button>
            </div>
          </div>

          {/* 총 건수 및 액션 버튼 */}
          <div className={styles.listTable}>
            <div className={styles.tableTop}>
              <div className={styles.topTotal}>
                <p>
                  총 <span>{totalItems}</span>건의 거래처가 조회되었습니다.
                </p>
              </div>
              <div className={styles.topBtnGroup}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="btn btn_md normal"
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={refreshing}
                  className="btn btn_md normal disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={`inline mr-1 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  전체 상태 새로고침
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedRows.size === 0}
                  className="btn btn_md primary disabled:opacity-50"
                >
                  선택 삭제
                </button>
                <button
                  type="button"
                  className="btn btn_md normal excel_btn"
                  onClick={handleExcelDownload}
                >
                  <Download size={16} className="inline mr-1" />
                  엑셀다운로드
                </button>
                <select
                  className="view_select"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10개씩 보기</option>
                  <option value={30}>50개씩 보기</option>
                  <option value={50}>100개씩 보기</option>
                  <option value={100}>200개씩 보기</option>
                </select>
              </div>
            </div>
          </div>

          {/* 테이블 */}
          <div className={styles.tableWrap}>
            <table>
              <colgroup>
                <col style={{ width: "5%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "13%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      id="checkAll"
                      checked={
                        selectedRows.size === currentClients.length &&
                        currentClients.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>번호</th>
                  <th>사업자 등록 번호</th>
                  <th>회사명</th>
                  <th>대표자명</th>
                  <th>휴·폐업 상태</th>
                </tr>
              </thead>
              <tbody>
                {currentClients.map((client, idx) => {
                  const isSelected = selectedRows.has(client.id);
                  const status = mapStatus(client.status);

                  return (
                    <tr
                      key={client.id}
                      onClick={() => handleRowClick(client.id)}
                      className={
                        loading && selectedClientId === client.id
                          ? "opacity-50"
                          : ""
                      }
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rowCheck"
                          checked={isSelected}
                          onChange={() => handleRowSelect(client.id)}
                        />
                      </td>
                      <td>{startIndex + idx + 1}</td>
                      <td>{client.business_registration_number}</td>
                      <td>{client.name}</td>
                      <td>{client.ceo_name || ""}</td>
                      <td>
                        <span className={getStatusClassName(status)}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 페이지네이션 */}
        <div className={styles.pagination}>
          <ul>
            <li
              className={`${styles.page} ${styles.first} ${
                currentPage === 1 ? styles.disabled : ""
              }`}
              onClick={() => currentPage !== 1 && setCurrentPage(1)}
            ></li>
            <li
              className={`${styles.page} ${styles.prev} ${
                currentPage === 1 ? styles.disabled : ""
              }`}
              onClick={() =>
                currentPage !== 1 && setCurrentPage((p) => Math.max(1, p - 1))
              }
            ></li>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </li>
              );
            })}

            <li
              className={`${styles.page} ${styles.next} ${
                currentPage === totalPages ? styles.disabled : ""
              }`}
              onClick={() =>
                currentPage !== totalPages &&
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
            ></li>
            <li
              className={`${styles.page} ${styles.last} ${
                currentPage === totalPages ? styles.disabled : ""
              }`}
              onClick={() =>
                currentPage !== totalPages && setCurrentPage(totalPages)
              }
            ></li>
          </ul>
        </div>
      </div>

      {/* 상세조회 모달 */}
      {selectedClientDetail && (
        <ClientDetailModal
          client={selectedClientDetail}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedClientId(null);
            setSelectedClientDetail(null);
          }}
        />
      )}
    </div>
  );
}
