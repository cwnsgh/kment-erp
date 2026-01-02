"use client";

import { useState, useEffect } from "react";
import { getClientsForModal } from "@/app/actions/managed-client";
import { X } from "lucide-react";

type Client = {
  id: string;
  business_registration_number: string;
  name: string;
  ceo_name: string | null;
  status: string;
  hasManagedProduct?: boolean;
};

type ClientSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (clientId: string) => void;
};

export function ClientSelectModal({
  isOpen,
  onClose,
  onSelect,
}: ClientSelectModalProps) {
  const [searchType, setSearchType] = useState<"name" | "ceo">("name");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    setIsLoading(true);
    setError("");
    const result = await getClientsForModal(searchType, searchKeyword);
    if (result.success) {
      setClients(result.clients);
    } else {
      setError(result.error || "거래처 조회에 실패했습니다.");
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadClients();
  };

  const handleSelect = (clientId: string) => {
    onSelect(clientId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-slate-900">거래처 목록</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* 검색 영역 */}
        <div className="p-6 border-b">
          <form onSubmit={handleSearch} className="flex gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "name" | "ceo")}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="name">회사명</option>
              <option value="ceo">대표자명</option>
            </select>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              검색
            </button>
          </form>
        </div>

        {/* 목록 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-slate-500">조회 중...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              조회된 거래처가 없습니다.
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-slate-600">
                총 <span className="font-semibold">{clients.length}건</span>의
                거래처가 조회되었습니다.
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        사업자 등록 번호
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        회사명
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        대표자명
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        선택
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr
                        key={client.id}
                        className="border-b transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {client.business_registration_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {client.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {client.ceo_name || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleSelect(client.id)}
                            disabled={client.hasManagedProduct || false}
                            className="px-3 py-1.5 text-sm rounded transition bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            선택
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
