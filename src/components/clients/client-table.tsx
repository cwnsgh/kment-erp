'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ClientDetailModal } from './client-detail-modal';
import { getClientDetail, refreshBusinessStatus } from '@/app/actions/client';
import { useRouter } from 'next/navigation';

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

const statusTone: Record<string, string> = {
  정상: 'bg-blue-50 text-blue-600',
  폐업: 'bg-red-50 text-red-600',
  휴업: 'bg-slate-100 text-slate-600',
};

// DB status를 UI status로 변환
const mapStatus = (status: string): '정상' | '휴업' | '폐업' => {
  const statusMap: Record<string, '정상' | '휴업' | '폐업'> = {
    approved: '정상',
    suspended: '휴업',
    closed: '폐업',
  };
  return statusMap[status] || '정상';
};

export function ClientTable({ initialClients }: ClientTableProps) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientDetail, setSelectedClientDetail] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingClientId, setRefreshingClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientRow[]>(initialClients);

  // initialClients가 변경되면 clients도 업데이트
  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  const totalItems = clients.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = clients.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

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
      alert('거래처 정보를 불러오는데 실패했습니다.');
    }
    setLoading(false);
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return;
    if (confirm(`선택한 ${selectedRows.size}건을 삭제하시겠습니까?`)) {
      setSelectedRows(new Set());
    }
  };

  // 상태 새로고침 (전체 또는 선택한 거래처)
  const handleRefreshStatus = async (clientIds?: string[]) => {
    const targetIds = clientIds || (selectedRows.size > 0 ? Array.from(selectedRows) : []);
    const isSelective = targetIds.length > 0;

    if (isSelective && targetIds.length === 0) {
      alert('새로고침할 거래처를 선택해주세요.');
      return;
    }

    if (!confirm(isSelective 
      ? `선택한 ${targetIds.length}건의 상태를 새로고침하시겠습니까?`
      : '전체 거래처의 상태를 새로고침하시겠습니까?')) {
      return;
    }

    setRefreshing(true);
    try {
      const result = await refreshBusinessStatus(isSelective ? targetIds : []);
      
      if (result.success) {
        alert(result.message || `총 ${result.updated}건의 상태가 업데이트되었습니다.`);
        // 페이지 새로고침
        router.refresh();
        // 선택 해제
        setSelectedRows(new Set());
      } else {
        alert(`상태 새로고침 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('상태 새로고침 오류:', error);
      alert('상태 새로고침 중 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  // 개별 거래처 상태 새로고침
  const handleRefreshSingleStatus = async (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 행 클릭 이벤트 방지
    
    setRefreshingClientId(clientId);
    try {
      const result = await refreshBusinessStatus([clientId]);
      
      if (result.success) {
        if (result.updated > 0) {
          alert('상태가 업데이트되었습니다.');
        } else {
          alert('변경된 상태가 없습니다.');
        }
        // 페이지 새로고침
        router.refresh();
      } else {
        alert(`상태 새로고침 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('상태 새로고침 오류:', error);
      alert('상태 새로고침 중 오류가 발생했습니다.');
    } finally {
      setRefreshingClientId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* 검색 필터 */}
        <div className="flex items-center gap-3">
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option>회사명</option>
            <option>사업자등록번호</option>
            <option>대표자명</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            검색
          </button>
        </div>

        {/* 총 건수 및 액션 버튼 */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">총 {totalItems}건의 거래처가 조회되었습니다.</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={() => handleRefreshStatus(selectedRows.size > 0 ? Array.from(selectedRows) : undefined)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {selectedRows.size > 0 ? `선택한 ${selectedRows.size}건 상태 새로고침` : '전체 상태 새로고침'}
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedRows.size === 0}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              선택 삭제
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <Download size={16} className="text-green-600" />
              엑셀 다운로드
            </button>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={10}>10개씩 보기</option>
              <option value={20}>20개씩 보기</option>
              <option value={50}>50개씩 보기</option>
            </select>
          </div>
        </div>

        {/* 테이블 */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === currentClients.length && currentClients.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    사업자 등록 번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    회사명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    대표자명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    휴·폐업 상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    상태 새로고침
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {currentClients.map((client, idx) => {
                  const isSelected = selectedRows.has(client.id);
                  const isFirstRow = idx === 0;
                  const isRefreshing = refreshingClientId === client.id;

                  return (
                    <tr
                      key={client.id}
                      onClick={() => handleRowClick(client.id)}
                      className={`cursor-pointer transition ${
                        isFirstRow ? 'bg-blue-50' : 'hover:bg-slate-50'
                      } ${loading && selectedClientId === client.id ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(client.id)}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                        {startIndex + currentClients.indexOf(client) + 1}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                        {client.business_registration_number}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">{client.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{client.ceo_name || ''}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusTone[mapStatus(client.status)] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {mapStatus(client.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleRefreshSingleStatus(client.id, e)}
                          disabled={isRefreshing}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="상태 새로고침"
                        >
                          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                          {isRefreshing ? '새로고침 중...' : '새로고침'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
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
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${
                  currentPage === pageNum
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                } transition`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight size={16} />
          </button>
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
    </>
  );
}
