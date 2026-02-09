"use client";

import { useState, FormEvent, useEffect } from "react";
import { getClientForManagedRegistration } from "@/app/actions/managed-client";
import { getAllEmployees } from "@/app/actions/work-request";
import { ClientSelectModal } from "../operations/client-select-modal";
import styles from "./contract-form.module.css";

type ClientData = {
  id: string;
  name: string;
  sites: Array<{
    brandName: string;
    domain: string;
    solution: string;
    loginId: string;
    loginPassword: string;
    type: string;
  }>;
  contacts: Array<{
    name: string;
    phone: string;
    email: string;
    title: string;
  }>;
};

type ContractData = {
  id: string;
  siteId: string;
  brandName: string;
  contractName: string;
  contractDate: string;
  contractType: string;
  draftDueDate: string;
  demoDueDate: string;
  finalCompletionDate: string;
  openDueDate: string;
  contractAmount: string;
  paymentProgress: "paid" | "installment" | "unpaid";
  installmentAmount: string;
  contractNote: string;
  contractFunctionality: string;
  pcModification: string;
  mobileModification: string;
  contractFile: File | null;
  estimateFile: File | null;
  primaryContact: string;
  secondaryContact: string;
  workNote: string;
};

export function ContractForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);

  // 직원 목록 로드
  useEffect(() => {
    const loadEmployees = async () => {
      const result = await getAllEmployees();
      if (result.success && result.data) {
        setEmployees(result.data);
      }
    };
    loadEmployees();
  }, []);

  const handleSelectClient = async (clientId: string) => {
    setIsLoading(true);
    setError("");
    const result = await getClientForManagedRegistration(clientId);
    if (result.success && result.client) {
      setClientData({
        id: result.client.id,
        name: result.client.name,
        sites: result.client.sites || [],
        contacts: result.client.contacts || [],
      });
      // 첫 번째 계약 초기화
      if (result.client.sites && result.client.sites.length > 0) {
        setContracts([
          {
            id: `contract-${Date.now()}`,
            siteId: "",
            brandName: "",
            contractName: "",
            contractDate: "",
            contractType: "신규",
            draftDueDate: "",
            demoDueDate: "",
            finalCompletionDate: "",
            openDueDate: "",
            contractAmount: "",
            paymentProgress: "unpaid",
            installmentAmount: "",
            contractNote: "",
            contractFunctionality: "",
            pcModification: "",
            mobileModification: "",
            contractFile: null,
            estimateFile: null,
            primaryContact: "",
            secondaryContact: "",
            workNote: "",
          },
        ]);
      }
    } else {
      setError(result.error || "거래처 정보를 불러오는데 실패했습니다.");
    }
    setIsLoading(false);
  };

  const handleAddContract = () => {
    if (!clientData || clientData.sites.length === 0) {
      setError("거래처를 먼저 선택해주세요.");
      return;
    }
    setContracts([
      ...contracts,
      {
        id: `contract-${Date.now()}`,
        siteId: "",
        brandName: "",
        contractName: "",
        contractDate: "",
        contractType: "신규",
        draftDueDate: "",
        demoDueDate: "",
        finalCompletionDate: "",
        openDueDate: "",
        contractAmount: "",
        paymentProgress: "unpaid",
        installmentAmount: "",
        contractNote: "",
        contractFunctionality: "",
        pcModification: "",
        mobileModification: "",
        contractFile: null,
        estimateFile: null,
        primaryContact: "",
        secondaryContact: "",
        workNote: "",
      },
    ]);
  };

  const handleRemoveContract = (contractId: string) => {
    if (contracts.length === 1) {
      setError("최소 하나의 계약은 필요합니다.");
      return;
    }
    setContracts(contracts.filter((c) => c.id !== contractId));
  };

  const handleContractChange = (contractId: string, field: keyof ContractData, value: any) => {
    setContracts(
      contracts.map((contract) => {
        if (contract.id === contractId) {
          // 브랜드명 선택 시 siteId도 함께 업데이트
          if (field === "brandName") {
            const site = clientData?.sites.find((s) => s.brandName === value);
            return {
              ...contract,
              brandName: value,
              siteId: site ? `${clientData?.id}-${site.brandName}` : "",
            };
          }
          return { ...contract, [field]: value };
        }
        return contract;
      })
    );
  };

  const handleFileChange = (contractId: string, field: "contractFile" | "estimateFile", file: File | null) => {
    setContracts(
      contracts.map((contract) => {
        if (contract.id === contractId) {
          return { ...contract, [field]: file };
        }
        return contract;
      })
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientData) {
      setError("거래처를 선택해주세요.");
      return;
    }
    if (contracts.length === 0) {
      setError("최소 하나의 계약을 등록해주세요.");
      return;
    }

    // 유효성 검사
    for (const contract of contracts) {
      if (!contract.brandName) {
        setError("브랜드명을 선택해주세요.");
        return;
      }
      if (!contract.contractName) {
        setError("계약명을 입력해주세요.");
        return;
      }
      if (!contract.contractDate) {
        setError("계약일을 입력해주세요.");
        return;
      }
    }

    setIsLoading(true);
    setError("");

    // TODO: Server Action 호출하여 계약 저장
    console.log("계약 데이터:", { clientId: clientData.id, contracts });

    // 임시로 성공 메시지
    alert("계약이 등록되었습니다.");
    setIsLoading(false);
  };

  return (
    <section className={`contract_regist page_section ${styles.contractRegist}`}>
      <div className="page_title">
        <h1>계약 등록</h1>
        <div className="btn_wrap">
          <button type="submit" form="contractForm" disabled={isLoading || !clientData} className="btn btn_lg primary">
            {isLoading ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>

      <form id="contractForm" onSubmit={handleSubmit}>
        <div className="white_box">
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}>
            <div className="import_btn btn btn_md black" onClick={() => setIsModalOpen(true)}>
              거래처 불러오기
            </div>
          </div>

          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px 14px",
                backgroundColor: "#fee",
                border: "1px solid #fcc",
                borderRadius: "6px",
                color: "var(--negative)",
                fontSize: "13px",
              }}>
              {error}
            </div>
          )}

          {isLoading && !clientData && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--text-gray)",
                fontSize: "14px",
              }}>
              거래처 정보를 불러오는 중...
            </div>
          )}

          {clientData && (
            <div className="box_inner">
              <div className="table_group">
                {/* 거래처 정보 */}
                <div className="table_item">
                  <h2 className="table_title">거래처 정보</h2>
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">거래처명</div>
                      <div className="table_data">{clientData.name}</div>
                    </li>
                  </ul>
                </div>

                {/* 계약 정보 */}
                <div className="table_item">
                  <h2 className="table_title">
                    계약 정보
                    <button 
                      type="button" 
                      onClick={handleAddContract} 
                      className={styles.addContractButton}
                      style={{ fontSize: "13px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                      + 계약 추가
                    </button>
                  </h2>

                  {contracts.map((contract, index) => (
                    <div key={contract.id} style={{ marginTop: index > 0 ? "40px" : "0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 className="table_title_sub">
                          계약 {index + 1} {contract.contractName ? `(${contract.contractName})` : "(등록 시 계약명으로 변경)"}
                        </h3>
                        {contracts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContract(contract.id)}
                            className="btn btn_sm normal"
                            style={{ fontSize: "13px" }}>
                            계약 삭제
                          </button>
                        )}
                      </div>

                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">브랜드명</div>
                        <div className="table_data">
                          <select
                            value={contract.brandName}
                            onChange={(e) => handleContractChange(contract.id, "brandName", e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm">
                            <option value="">브랜드명을 선택하세요</option>
                            {clientData.sites.map((site) => (
                              <option key={site.brandName} value={site.brandName}>
                                {site.brandName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">계약명</div>
                        <div className="table_data">
                          <input
                            type="text"
                            value={contract.contractName}
                            onChange={(e) => handleContractChange(contract.id, "contractName", e.target.value)}
                            placeholder="계약명을 입력하세요"
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                          />
                        </div>
                      </li>
                    </ul>

                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">계약일</div>
                        <div className="table_data">
                          <input
                            type="date"
                            value={contract.contractDate}
                            onChange={(e) => handleContractChange(contract.id, "contractDate", e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                          />
                        </div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">계약 종목</div>
                        <div className="table_data">
                          <select
                            value={contract.contractType}
                            onChange={(e) => handleContractChange(contract.id, "contractType", e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm">
                            <option value="신규">신규</option>
                            <option value="갱신">갱신</option>
                            <option value="추가">추가</option>
                          </select>
                        </div>
                      </li>
                    </ul>

                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">시안 완료 예정일</div>
                        <div className="table_data">
                          <input
                            type="date"
                            value={contract.draftDueDate}
                            onChange={(e) => handleContractChange(contract.id, "draftDueDate", e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                          />
                        </div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">데모 완료 예정일</div>
                        <div className="table_data">
                          <input
                            type="date"
                            value={contract.demoDueDate}
                            onChange={(e) => handleContractChange(contract.id, "demoDueDate", e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                          />
                        </div>
                      </li>
                    </ul>

                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">최종 완료일</div>
                        <div className="table_data">
                          <input
                            type="date"
                            value={contract.finalCompletionDate}
                            onChange={(e) => handleContractChange(contract.id, "finalCompletionDate", e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                          />
                        </div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">오픈 예정일</div>
                        <div className="table_data">
                          <input
                            type="date"
                            value={contract.openDueDate}
                            onChange={(e) => handleContractChange(contract.id, "openDueDate", e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                          />
                        </div>
                      </li>
                    </ul>

                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">계약금액</div>
                        <div className="table_data">
                          <input
                            type="text"
                            value={contract.contractAmount}
                            onChange={(e) => handleContractChange(contract.id, "contractAmount", e.target.value)}
                            placeholder="계약금액을 입력하세요"
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                          />
                        </div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">납부 진행</div>
                        <div className="table_data">
                          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "nowrap" }}>
                            <select
                              value={contract.paymentProgress}
                              onChange={(e) => handleContractChange(contract.id, "paymentProgress", e.target.value)}
                              className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                              style={{ width: "120px" }}>
                              <option value="paid">완납</option>
                              <option value="unpaid">미납</option>
                              <option value="installment">분납</option>
                            </select>
                            {contract.paymentProgress === "installment" && (
                              <input
                                type="text"
                                value={contract.installmentAmount}
                                onChange={(e) => handleContractChange(contract.id, "installmentAmount", e.target.value)}
                                placeholder="분납 금액"
                                className="border border-slate-200 rounded px-3 py-2 text-sm"
                                style={{ width: "150px" }}
                              />
                            )}
                          </div>
                        </div>
                      </li>
                    </ul>

                    <ul className="table_row">
                      <li className="row_group" style={{ width: "100%" }}>
                        <div className="table_head">계약 비고</div>
                        <div className="table_data">
                          <textarea
                            value={contract.contractNote}
                            onChange={(e) => handleContractChange(contract.id, "contractNote", e.target.value)}
                            placeholder="계약 비고를 입력하세요"
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            rows={3}
                          />
                        </div>
                      </li>
                    </ul>

                    <ul className="table_row">
                      <li className="row_group" style={{ width: "100%" }}>
                        <div className="table_head">계약 기능성</div>
                        <div className="table_data">
                          <textarea
                            value={contract.contractFunctionality}
                            onChange={(e) => handleContractChange(contract.id, "contractFunctionality", e.target.value)}
                            placeholder="계약 기능성을 입력하세요"
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            rows={3}
                          />
                        </div>
                      </li>
                    </ul>

                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">PC 수정</div>
                        <div className="table_data">
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                              type="text"
                              value={contract.pcModification}
                              onChange={(e) => handleContractChange(contract.id, "pcModification", e.target.value)}
                              placeholder="0"
                              className="border border-slate-200 rounded px-3 py-2 text-sm"
                              style={{ width: "80px" }}
                            />
                            <span>회</span>
                          </div>
                        </div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">모바일 수정</div>
                        <div className="table_data">
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                              type="text"
                              value={contract.mobileModification}
                              onChange={(e) => handleContractChange(contract.id, "mobileModification", e.target.value)}
                              placeholder="0"
                              className="border border-slate-200 rounded px-3 py-2 text-sm"
                              style={{ width: "80px" }}
                            />
                            <span>회</span>
                          </div>
                        </div>
                      </li>
                    </ul>

                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">계약서 첨부</div>
                        <div className="table_data">
                          <label className="btn btn_sm normal" style={{ cursor: "pointer" }}>
                            첨부파일
                            <input
                              type="file"
                              onChange={(e) => handleFileChange(contract.id, "contractFile", e.target.files?.[0] || null)}
                              style={{ display: "none" }}
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                          </label>
                          {contract.contractFile && <span style={{ marginLeft: "8px" }}>{contract.contractFile.name}</span>}
                        </div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">견적서 첨부</div>
                        <div className="table_data">
                          <label className="btn btn_sm normal" style={{ cursor: "pointer" }}>
                            첨부파일
                            <input
                              type="file"
                              onChange={(e) => handleFileChange(contract.id, "estimateFile", e.target.files?.[0] || null)}
                              style={{ display: "none" }}
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                          </label>
                          {contract.estimateFile && <span style={{ marginLeft: "8px" }}>{contract.estimateFile.name}</span>}
                        </div>
                      </li>
                    </ul>

                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">주 담당자</div>
                        <div className="table_data">
                          <select
                            value={contract.primaryContact}
                            onChange={(e) => handleContractChange(contract.id, "primaryContact", e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            required
                          >
                            <option value="">선택하세요</option>
                            {employees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">부 담당자</div>
                        <div className="table_data">
                          <select
                            value={contract.secondaryContact}
                            onChange={(e) => handleContractChange(contract.id, "secondaryContact", e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                          >
                            <option value="">선택하세요 (선택사항)</option>
                            {employees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </li>
                    </ul>

                    <ul className="table_row">
                      <li className="row_group" style={{ width: "100%" }}>
                        <div className="table_head">업무 비고</div>
                        <div className="table_data">
                          <textarea
                            value={contract.workNote}
                            onChange={(e) => handleContractChange(contract.id, "workNote", e.target.value)}
                            placeholder="업무 비고를 입력하세요"
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            rows={3}
                          />
                        </div>
                      </li>
                    </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      <ClientSelectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelect={handleSelectClient}
        allowAllClients={true}
      />
    </section>
  );
}
