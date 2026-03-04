"use client";
import { Plus, X, Upload, Trash2 } from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import { getClientForManagedRegistration } from "@/app/actions/managed-client";
import { getAllEmployees } from "@/app/actions/work-request";
import { getActiveContractTypes, getActiveWorkContentsByContractType } from "@/app/actions/contract-type";
import { createContract, uploadContractFile } from "@/app/actions/contract";
import { useRouter } from "next/navigation";
import { ClientSelectModal } from "../operations/client-select-modal";
import { formatAmountInput, parseAmountInput } from "@/lib/format-amount";
import styles from "./contract-form.module.css";

type ClientData = {
  id: string;
  name: string;
  businessRegistrationNumber?: string;
  ceoName?: string;
  postalCode?: string;
  address?: string;
  addressDetail?: string;
  businessType?: string;
  businessItem?: string;
  loginId?: string;
  loginPassword?: string;
  status?: string;
  note?: string;
  sites: Array<{
    id: string;
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
    title?: string;
    note?: string;
  }>;
  attachments?: Array<{ fileUrl: string; fileName: string; fileType: string }>;
};

type WorkContentData = {
  workContentId: string;
  workContentName: string;
  modificationCount: string;
};

type ContractData = {
  id: string;
  siteId: string;
  brandName: string;
  contractName: string;
  contractDate: string;
  contractTypeId: string;
  draftDueDate: string;
  demoDueDate: string;
  finalCompletionDate: string;
  openDueDate: string;
  contractAmount: string;
  paymentProgress: "paid" | "installment" | "unpaid";
  installmentAmount: string;
  contractNote: string;
  contractFunctionality: string;
  workContents: WorkContentData[];
  contractFile: File | null;
  estimateFile: File | null;
  primaryContact: string;
  secondaryContact: string;
  workNote: string;
};

export function ContractForm() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [contractTypes, setContractTypes] = useState<Array<{ id: string; name: string }>>([]);

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

  // 계약 종목 목록 로드
  useEffect(() => {
    const loadContractTypes = async () => {
      const result = await getActiveContractTypes();
      if (result.success && result.data) {
        setContractTypes(result.data);
      }
    };
    loadContractTypes();
  }, []);

  const handleSelectClient = async (clientId: string) => {
    setIsLoading(true);
    setError("");
    const result = await getClientForManagedRegistration(clientId);
    if (result.success && result.client) {
      const c = result.client as any;
      setClientData({
        id: c.id,
        name: c.name,
        businessRegistrationNumber: c.businessRegistrationNumber,
        ceoName: c.ceoName,
        postalCode: c.postalCode,
        address: c.address,
        addressDetail: c.addressDetail,
        businessType: c.businessType,
        businessItem: c.businessItem,
        loginId: c.loginId,
        loginPassword: c.loginPassword,
        status: c.status,
        note: c.note,
        sites: (c.sites || []).map((s: any) => ({
          id: s.id,
          brandName: s.brandName,
          domain: s.domain,
          solution: s.solution,
          loginId: s.loginId,
          loginPassword: s.loginPassword,
          type: s.type,
        })),
        contacts: c.contacts || [],
        attachments: c.attachments,
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
            contractTypeId: "",
            draftDueDate: "",
            demoDueDate: "",
            finalCompletionDate: "",
            openDueDate: "",
            contractAmount: "",
            paymentProgress: "unpaid",
            installmentAmount: "",
            contractNote: "",
            contractFunctionality: "",
            workContents: [],
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
        contractTypeId: "",
        draftDueDate: "",
        demoDueDate: "",
        finalCompletionDate: "",
        openDueDate: "",
        contractAmount: "",
        paymentProgress: "unpaid",
        installmentAmount: "",
        contractNote: "",
        contractFunctionality: "",
        workContents: [],
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

  const handleContractChange = async (contractId: string, field: keyof ContractData, value: any) => {
    // 먼저 상태 업데이트
    const updatedContracts = contracts.map((contract) => {
      if (contract.id === contractId) {
        // 브랜드명 선택 시 siteId도 함께 업데이트
        if (field === "brandName") {
          const site = clientData?.sites.find((s) => s.brandName === value);
          return {
            ...contract,
            brandName: value,
            siteId: site ? site.id : "",
          };
        }
        // 계약 종목 변경 시 작업 내용 초기화
        if (field === "contractTypeId") {
          return { ...contract, contractTypeId: value, workContents: [] };
        }
        return { ...contract, [field]: value };
      }
      return contract;
    });

    setContracts(updatedContracts);

    // 계약 종목 변경 시 작업 내용 로드
    if (field === "contractTypeId" && value) {
      const result = await getActiveWorkContentsByContractType(value);
      if (result.success && result.data) {
        // 업데이트된 contracts를 사용하여 작업 내용 추가
        setContracts((prevContracts) =>
          prevContracts.map((contract) => {
            if (contract.id === contractId) {
              return {
                ...contract,
                contractTypeId: value,
                workContents: result.data!.map((wc) => ({
                  workContentId: wc.id,
                  workContentName: wc.work_content_name,
                  modificationCount: String(Math.max(0, wc.default_modification_count ?? 0)),
                })),
              };
            }
            return contract;
          }),
        );
      }
    }
  };

  const handleWorkContentChange = (contractId: string, workContentId: string, modificationCount: string) => {
    setContracts(
      contracts.map((contract) => {
        if (contract.id === contractId) {
          return {
            ...contract,
            workContents: contract.workContents.map((wc) => (wc.workContentId === workContentId ? { ...wc, modificationCount } : wc)),
          };
        }
        return contract;
      }),
    );
  };

  const handleFileChange = (contractId: string, field: "contractFile" | "estimateFile", file: File | null) => {
    setContracts(
      contracts.map((contract) => {
        if (contract.id === contractId) {
          return { ...contract, [field]: file };
        }
        return contract;
      }),
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
        setIsLoading(false);
        return;
      }
      if (!contract.siteId) {
        setError("사이트 ID가 없습니다. 브랜드명을 다시 선택해주세요.");
        setIsLoading(false);
        return;
      }
      if (!contract.contractName) {
        setError("계약명을 입력해주세요.");
        setIsLoading(false);
        return;
      }
      if (!contract.contractDate) {
        setError("계약일을 입력해주세요.");
        setIsLoading(false);
        return;
      }
      if (!contract.contractTypeId) {
        setError("계약 종목을 선택해주세요.");
        setIsLoading(false);
        return;
      }
      if (!contract.primaryContact) {
        setError("주 담당자를 선택해주세요.");
        setIsLoading(false);
        return;
      }
      // 분납인 경우 분납 금액 확인
      if (contract.paymentProgress === "installment" && !contract.installmentAmount) {
        setError("분납을 선택한 경우 분납 금액을 입력해주세요.");
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError("");

    try {
      // 파일 업로드 처리
      const contractsWithFiles = await Promise.all(
        contracts.map(async (contract) => {
          let contractFileUrl: string | undefined;
          let estimateFileUrl: string | undefined;

          // 계약서 파일 업로드
          if (contract.contractFile) {
            const uploadResult = await uploadContractFile(contract.contractFile, "contract");
            if (!uploadResult.success) {
              throw new Error(uploadResult.error || "계약서 파일 업로드에 실패했습니다.");
            }
            contractFileUrl = uploadResult.url;
          }

          // 견적서 파일 업로드
          if (contract.estimateFile) {
            const uploadResult = await uploadContractFile(contract.estimateFile, "estimate");
            if (!uploadResult.success) {
              throw new Error(uploadResult.error || "견적서 파일 업로드에 실패했습니다.");
            }
            estimateFileUrl = uploadResult.url;
          }

          return {
            siteId: contract.siteId,
            contractName: contract.contractName,
            contractDate: contract.contractDate,
            contractTypeId: contract.contractTypeId,
            draftDueDate: contract.draftDueDate || undefined,
            demoDueDate: contract.demoDueDate || undefined,
            finalCompletionDate: contract.finalCompletionDate || undefined,
            openDueDate: contract.openDueDate || undefined,
            contractAmount: parseFloat(contract.contractAmount) || 0,
            paymentProgress: contract.paymentProgress,
            installmentAmount: contract.installmentAmount ? parseFloat(contract.installmentAmount) : undefined,
            contractNote: contract.contractNote || undefined,
            contractFunctionality: contract.contractFunctionality || undefined,
            workContents: contract.workContents.map((wc) => ({
              workContentId: wc.workContentId,
              modificationCount: parseInt(wc.modificationCount) || 0,
            })),
            contractFileUrl,
            estimateFileUrl,
            primaryContact: contract.primaryContact,
            secondaryContact: contract.secondaryContact || undefined,
            workNote: contract.workNote || undefined,
          };
        }),
      );

      // 계약 저장
      const result = await createContract(clientData.id, contractsWithFiles);

      if (!result.success) {
        setError(result.error || "계약 등록에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      // 성공 시 계약 목록 페이지로 이동
      alert("계약이 등록되었습니다.");
      router.push("/contracts");
    } catch (err: any) {
      setError(err.message || "계약 등록 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
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
                {/* ERP 정보 */}
                <div className="table_item">
                  <h2 className="table_title">ERP 정보</h2>
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">아이디</div>
                      <div className="table_data">{clientData.loginId || "-"}</div>
                    </li>
                    <li className="row_group">
                      <div className="table_head">패스워드</div>
                      <div className="table_data">{clientData.loginPassword ? "••••••••" : "-"}</div>
                    </li>
                  </ul>
                </div>

                {/* 기본 정보 */}
                <div className="table_item">
                  <h2 className="table_title">기본 정보</h2>
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">거래처 사업자등록번호</div>
                      <div className="table_data">{clientData.businessRegistrationNumber || "-"}</div>
                    </li>
                  </ul>
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">상호(법인명)</div>
                      <div className="table_data">{clientData.name || "-"}</div>
                    </li>
                    <li className="row_group">
                      <div className="table_head">대표자</div>
                      <div className="table_data">{clientData.ceoName || "-"}</div>
                    </li>
                  </ul>
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">사업자 주소</div>
                      <div className="table_data">{[clientData.address, clientData.addressDetail].filter(Boolean).join(" ") || "-"}</div>
                    </li>
                  </ul>
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">업태</div>
                      <div className="table_data">{clientData.businessType || "-"}</div>
                    </li>
                    <li className="row_group">
                      <div className="table_head">종목</div>
                      <div className="table_data">{clientData.businessItem || "-"}</div>
                    </li>
                  </ul>
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">휴·폐업 상태</div>
                      <div className="table_data">{clientData.status || "-"}</div>
                    </li>
                  </ul>
                </div>

                {/* 담당자 정보 */}
                <div className="table_item">
                  <h2 className="table_title">담당자 정보</h2>
                  {clientData.contacts.length === 0 ? (
                    <div className={styles.infoEmpty}>등록된 담당자가 없습니다.</div>
                  ) : (
                    clientData.contacts.map((contact, idx) => (
                      <div key={idx} className={styles.contactBlock}>
                        <h3 className="table_title_sub">담당자 {idx + 1}</h3>
                        <div className={styles.contactGrid}>
                          <div className={styles.contactLabel}>이름</div>
                          <div className={styles.contactValue}>{contact.name || "-"}</div>
                          <div className={styles.contactLabel}>담당자</div>
                          <div className={styles.contactValue}>{contact.title || "-"}</div>
                          <div className={styles.contactLabel}>이메일</div>
                          <div className={styles.contactValue}>{contact.email || "-"}</div>
                          <div className={styles.contactLabel}>연락처</div>
                          <div className={styles.contactValue}>{contact.phone || "-"}</div>
                          <div className={styles.contactLabel}>비고</div>
                          <div className={styles.contactValue}>{contact.note || "-"}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 사이트 정보 */}
                <div className="table_item">
                  <h2 className="table_title">사이트 정보</h2>
                  {clientData.sites.length === 0 ? (
                    <div className={styles.infoEmpty}>등록된 사이트가 없습니다.</div>
                  ) : (
                    <div className={styles.siteTableWrap}>
                      <table className={styles.siteTable}>
                        <thead>
                          <tr>
                            <th>브랜드</th>
                            <th>도메인</th>
                            <th>솔루션</th>
                            <th>아이디</th>
                            <th>패스워드</th>
                            <th>비고</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientData.sites.map((site, idx) => (
                            <tr key={site.id || idx}>
                              <td>{site.brandName || "-"}</td>
                              <td>{site.domain || "-"}</td>
                              <td>{site.solution || "-"}</td>
                              <td>{site.loginId || "-"}</td>
                              <td>{site.loginPassword ? "••••••••" : "-"}</td>
                              <td>{site.type || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 비고 */}
                <div className="table_item">
                  <h2 className="table_title">비고</h2>
                  <div className={styles.noteBlock}>{clientData.note ? <p className={styles.noteText}>{clientData.note}</p> : <p className={styles.notePlaceholder}>거래처에 등록되어있는 정보가 제공됩니다.</p>}</div>
                </div>

                {/* 계약 정보 */}
                <div className="table_item">
                  <h2 className="table_title">
                    계약 정보
                    <button type="button" onClick={handleAddContract} className={styles.addContractButton} style={{ fontSize: "13px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                      + 계약 추가
                    </button>
                  </h2>

                  {contracts.map((contract, index) => (
                    <div key={contract.id} style={{ marginTop: index > 0 ? "40px" : "0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 className="table_title_sub">
                          계약 {index + 1} {contract.contractName ? `(${contract.contractName})` : "(등록 시 계약명으로 변경)"}
                        </h3>
                        {contracts.length > 1 && (
                          <button type="button" onClick={() => handleRemoveContract(contract.id)}>
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">브랜드명</div>
                          <div className="table_data">
                            <select value={contract.brandName} onChange={(e) => handleContractChange(contract.id, "brandName", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm">
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
                            <input type="text" value={contract.contractName} onChange={(e) => handleContractChange(contract.id, "contractName", e.target.value)} placeholder="계약명을 입력하세요" className="w-full border border-slate-200 rounded px-3 py-2 text-sm" />
                          </div>
                        </li>
                      </ul>

                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">계약일</div>
                          <div className="table_data">
                            <input type="date" value={contract.contractDate} onChange={(e) => handleContractChange(contract.id, "contractDate", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm" />
                          </div>
                        </li>
                        <li className="row_group">
                          <div className="table_head">계약 종목</div>
                          <div className="table_data">
                            <select value={contract.contractTypeId} onChange={(e) => handleContractChange(contract.id, "contractTypeId", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm" required>
                              <option value="">계약 종목을 선택하세요</option>
                              {contractTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </li>
                      </ul>

                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">시안 완료 예정일</div>
                          <div className="table_data">
                            <input type="date" value={contract.draftDueDate} onChange={(e) => handleContractChange(contract.id, "draftDueDate", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm" />
                          </div>
                        </li>
                        <li className="row_group">
                          <div className="table_head">데모 완료 예정일</div>
                          <div className="table_data">
                            <input type="date" value={contract.demoDueDate} onChange={(e) => handleContractChange(contract.id, "demoDueDate", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm" />
                          </div>
                        </li>
                      </ul>

                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">최종 완료일</div>
                          <div className="table_data">
                            <input type="date" value={contract.finalCompletionDate} onChange={(e) => handleContractChange(contract.id, "finalCompletionDate", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm" />
                          </div>
                        </li>
                        <li className="row_group">
                          <div className="table_head">오픈 예정일</div>
                          <div className="table_data">
                            <input type="date" value={contract.openDueDate} onChange={(e) => handleContractChange(contract.id, "openDueDate", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm" />
                          </div>
                        </li>
                      </ul>

                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">계약금액</div>
                          <div className="table_data">
                            <input type="text" value={formatAmountInput(contract.contractAmount)} onChange={(e) => handleContractChange(contract.id, "contractAmount", parseAmountInput(e.target.value))} placeholder="계약금액을 입력하세요" className="w-full border border-slate-200 rounded px-3 py-2 text-sm" />
                          </div>
                        </li>
                        <li className="row_group">
                          <div className="table_head">납부 진행</div>
                          <div className="table_data">
                            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "nowrap" }}>
                              <select value={contract.paymentProgress} onChange={(e) => handleContractChange(contract.id, "paymentProgress", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm" style={{ width: "120px" }}>
                                <option value="paid">완납</option>
                                <option value="unpaid">미납</option>
                                <option value="installment">분납</option>
                              </select>
                              {contract.paymentProgress === "installment" && <input type="text" value={formatAmountInput(contract.installmentAmount)} onChange={(e) => handleContractChange(contract.id, "installmentAmount", parseAmountInput(e.target.value))} placeholder="분납 금액" className="border border-slate-200 rounded px-3 py-2 text-sm" style={{ width: "150px" }} />}
                            </div>
                          </div>
                        </li>
                      </ul>

                      <ul className="table_row">
                        <li className="row_group" style={{ width: "100%" }}>
                          <div className="table_head">계약 비고</div>
                          <div className="table_data">
                            <textarea value={contract.contractNote} onChange={(e) => handleContractChange(contract.id, "contractNote", e.target.value)} placeholder="계약 비고를 입력하세요" className="w-full border border-slate-200 rounded px-3 py-2 text-sm" rows={3} />
                          </div>
                        </li>
                      </ul>

                      <ul className="table_row">
                        <li className="row_group" style={{ width: "100%" }}>
                          <div className="table_head">계약 기능성</div>
                          <div className="table_data">
                            <textarea value={contract.contractFunctionality} onChange={(e) => handleContractChange(contract.id, "contractFunctionality", e.target.value)} placeholder="계약 기능성을 입력하세요" className="w-full border border-slate-200 rounded px-3 py-2 text-sm" rows={3} />
                          </div>
                        </li>
                      </ul>

                      {contract.contractTypeId && contract.workContents.length > 0 && (
                        <ul className="table_row">
                          <li className="row_group" style={{ width: "100%" }}>
                            <div className="table_head">작업 내용 및 수정 횟수</div>
                            <div className="table_data" style={{ padding: "0px" }}>
                              <div style={{ display: "flex", flexWrap: "wrap" }}>
                                {contract.workContents.map((workContent) => (
                                  <div
                                    key={workContent.workContentId}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      padding: "18px 20px",
                                      borderRadius: "4px",
                                    }}>
                                    <span style={{ minWidth: "120px", fontSize: "13px" }}>{workContent.workContentName}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <input type="number" value={workContent.modificationCount} onChange={(e) => handleWorkContentChange(contract.id, workContent.workContentId, e.target.value)} placeholder="0" className="border border-slate-200 rounded px-3 py-2 text-sm" style={{ width: "80px" }} min="0" />
                                      <span>회</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </li>
                        </ul>
                      )}

                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">계약서 첨부</div>
                          <div className="table_data">
                            <label className="file-upload-btn" style={{ cursor: "pointer" }}>
                              첨부파일 <img src="/images/attach_icon.svg" alt="첨부" width={16} height={16} />
                              <input type="file" onChange={(e) => handleFileChange(contract.id, "contractFile", e.target.files?.[0] || null)} style={{ display: "none" }} accept=".pdf,.jpg,.jpeg,.png" />
                            </label>
                            {contract.contractFile && (
                              <span className="attach" style={{ marginLeft: "8px" }}>
                                {contract.contractFile.name}
                              </span>
                            )}
                          </div>
                        </li>
                        <li className="row_group">
                          <div className="table_head">견적서 첨부</div>
                          <div className="table_data">
                            <label className="file-upload-btn" style={{ cursor: "pointer" }}>
                              첨부파일 <img src="/images/attach_icon.svg" alt="첨부" width={16} height={16} />
                              <input type="file" onChange={(e) => handleFileChange(contract.id, "estimateFile", e.target.files?.[0] || null)} style={{ display: "none" }} accept=".pdf,.jpg,.jpeg,.png" />
                            </label>
                            {contract.estimateFile && (
                              <span className="attach" style={{ marginLeft: "8px" }}>
                                {contract.estimateFile.name}
                              </span>
                            )}
                          </div>
                        </li>
                      </ul>

                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">주 담당자</div>
                          <div className="table_data">
                            <select value={contract.primaryContact} onChange={(e) => handleContractChange(contract.id, "primaryContact", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm" required>
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
                            <select value={contract.secondaryContact} onChange={(e) => handleContractChange(contract.id, "secondaryContact", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm">
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
                            <textarea value={contract.workNote} onChange={(e) => handleContractChange(contract.id, "workNote", e.target.value)} placeholder="업무 비고를 입력하세요" className="w-full border border-slate-200 rounded px-3 py-2 text-sm" rows={3} />
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

      <ClientSelectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handleSelectClient} allowAllClients={true} />
    </section>
  );
}
