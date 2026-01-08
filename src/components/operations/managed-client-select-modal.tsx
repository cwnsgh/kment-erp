"use client";

import { useState, useEffect } from "react";
import { getManagedClients } from "@/app/actions/managed-client";
import { X } from "lucide-react";

type ManagedClient = {
  id: string;
  clientId: string;
  companyName: string;
  brandNames: string[];
  productType1: "deduct" | "maintenance";
  productType2: string;
  status: string;
};

type ManagedClientSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (managedClientId: string) => void;
};

export function ManagedClientSelectModal({
  isOpen,
  onClose,
  onSelect,
}: ManagedClientSelectModalProps) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [productType1, setProductType1] = useState<"deduct" | "maintenance" | "">("");
  const [status, setStatus] = useState<"ongoing" | "wait" | "end" | "unpaid" | "">("");
  const [managedClients, setManagedClients] = useState<ManagedClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadManagedClients();
    }
  }, [isOpen]);

  const loadManagedClients = async () => {
    setIsLoading(true);
    setError("");
    const result = await getManagedClients({
      page: 1,
      limit: 100, // 모달에서는 더 많이 보여줌
      searchKeyword: searchKeyword || undefined,
      productType1: productType1 || undefined,
      status: status || undefined,
    });
    if (result.success) {
      setManagedClients(result.managedClients);
    } else {
      setError(result.error || "관리고객 조회에 실패했습니다.");
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadManagedClients();
  };

  const handleSelect = (managedClientId: string) => {
    onSelect(managedClientId);
    onClose();
  };

  const formatProductType = (type1: string, type2: string) => {
    if (type1 === "deduct") {
      return `금액차감형(${type2.toUpperCase()})`;
    } else if (type1 === "maintenance") {
      const type2Label = type2 === "standard" ? "S" : "P";
      return `유지보수형(${type2Label})`;
    }
    return "";
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      ongoing: "진행",
      wait: "대기",
      end: "종료",
      unpaid: "미납",
    };
    return statusMap[status] || status;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-slate-900">관리고객 목록</h3>
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
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="회사명(브랜드명) 검색"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                검색
              </button>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">관리유형:</span>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="productType1"
                    value=""
                    checked={productType1 === ""}
                    onChange={() => setProductType1("")}
                  />
                  전체
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="productType1"
                    value="deduct"
                    checked={productType1 === "deduct"}
                    onChange={() => setProductType1("deduct")}
                  />
                  금액차감형
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="productType1"
                    value="maintenance"
                    checked={productType1 === "maintenance"}
                    onChange={() => setProductType1("maintenance")}
                  />
                  유지보수형
                </label>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">진행상황:</span>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    value=""
                    checked={status === ""}
                    onChange={() => setStatus("")}
                  />
                  전체
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    value="ongoing"
                    checked={status === "ongoing"}
                    onChange={() => setStatus("ongoing")}
                  />
                  진행
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    value="wait"
                    checked={status === "wait"}
                    onChange={() => setStatus("wait")}
                  />
                  대기
                </label>
              </div>
            </div>
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
          ) : managedClients.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              조회된 관리고객이 없습니다.
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-slate-600">
                총 <span className="font-semibold">{managedClients.length}건</span>의
                관리고객이 조회되었습니다.
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        회사명
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        브랜드명
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        관리유형
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        진행상황
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        선택
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {managedClients.map((mc) => (
                      <tr
                        key={mc.id}
                        className="border-b transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {mc.companyName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {mc.brandNames.join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {formatProductType(mc.productType1, mc.productType2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {getStatusLabel(mc.status)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleSelect(mc.id)}
                            className="px-3 py-1.5 text-sm rounded transition bg-primary text-white hover:bg-primary/90"
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




