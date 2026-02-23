"use client";

import { X } from "lucide-react";
import { useState, useTransition } from "react";
import Image from "next/image";
import { ContractSelectModal } from "./contract-select-modal";
import { getContractForTaskRegistration, getContractWorkRequestsByContract, createContractWorkRequest, updateContractWorkRequestStatus, deleteContractWorkRequest } from "@/app/actions/contract-work-request";
import styles from "./contract-task-registration-form.module.css";
import manageStyles from "../operations/manage-work-registration-form.module.css";

type ContractData = Awaited<ReturnType<typeof getContractForTaskRegistration>>;
type ContractDetail = NonNullable<ContractData["contract"]>;
type WorkContent = NonNullable<ContractData["workContents"]>[number];
type RequestRow = NonNullable<Awaited<ReturnType<typeof getContractWorkRequestsByContract>>["requests"]>[number];

type NewTaskRow = {
  id: string;
  contractWorkContentId: string;
  brandName: string;
  manager: string;
  workPeriod: string;
  attachment: File | null;
  workContent: string;
  memo: string;
};

type ContractTaskRegistrationFormProps = {
  employeeName: string;
};

export function ContractTaskRegistrationForm({ employeeName }: ContractTaskRegistrationFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [erpOpen, setErpOpen] = useState(false);
  const [basicOpen, setBasicOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const [newRows, setNewRows] = useState<NewTaskRow[]>([]);

  const contract = contractData?.contract;
  const client = contractData?.client;
  const sites = contractData?.sites ?? [];
  const contacts = contractData?.contacts ?? [];
  const workContents = contractData?.workContents ?? [];

  const loadRequests = (contractId: string) => {
    startTransition(async () => {
      const res = await getContractWorkRequestsByContract(contractId);
      if (res.success && res.requests) setRequests(res.requests);
      else setRequests([]);
    });
  };

  const handleSelectContract = async (contractId: string) => {
    setError("");
    setIsLoading(true);
    const detail = await getContractForTaskRegistration(contractId);
    if (detail.success && detail.contract) {
      setContractData(detail);
      loadRequests(contractId);
      const wcs = detail.workContents ?? [];
      setNewRows(
        wcs.length
          ? [
              {
                id: `new-${Date.now()}`,
                contractWorkContentId: wcs[0].id,
                brandName: "",
                manager: employeeName,
                workPeriod: "",
                attachment: null,
                workContent: "",
                memo: "",
              },
            ]
          : [],
      );
    } else {
      setError(detail.error ?? "계약 정보를 불러올 수 없습니다.");
      setContractData(null);
      setRequests([]);
    }
    setIsLoading(false);
  };

  const addNewRow = () => {
    setNewRows((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        contractWorkContentId: workContents[0]?.id ?? "",
        brandName: "",
        manager: employeeName,
        workPeriod: "",
        attachment: null,
        workContent: "",
        memo: "",
      },
    ]);
  };

  const updateNewRow = (id: string, field: keyof NewTaskRow, value: any) => {
    setNewRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeNewRow = (id: string) => {
    setNewRows((prev) => prev.filter((r) => r.id !== id));
  };

  const uploadFile = async (file: File): Promise<{ url: string; fileName: string } | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "work-attachment");
    const res = await fetch("/api/files/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.success && data.url ? { url: data.url, fileName: data.fileName || file.name } : null;
  };

  const handleSubmitRequest = async (row: NewTaskRow) => {
    if (!contract?.id || !client?.id) {
      alert("계약을 먼저 불러와 주세요.");
      return;
    }
    if (!row.brandName?.trim()) {
      alert("브랜드를 선택해 주세요.");
      return;
    }
    if (!row.contractWorkContentId) {
      alert("작업 유형을 선택해 주세요.");
      return;
    }
    setIsLoading(true);
    setError("");
    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;
    if (row.attachment) {
      const up = await uploadFile(row.attachment);
      if (!up) {
        alert("첨부파일 업로드에 실패했습니다.");
        setIsLoading(false);
        return;
      }
      attachmentUrl = up.url;
      attachmentName = up.fileName;
    }
    const result = await createContractWorkRequest({
      contractId: contract.id,
      clientId: client.id,
      contractWorkContentId: row.contractWorkContentId,
      brandName: row.brandName,
      manager: row.manager,
      workPeriod: row.workPeriod,
      attachmentUrl,
      attachmentName,
      workContent: row.workContent,
      memo: row.memo,
    });
    if (result.success) {
      loadRequests(contract.id);
      setNewRows((prev) => prev.filter((r) => r.id !== row.id));
    } else {
      alert(result.error ?? "승인 요청 등록에 실패했습니다.");
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (requestId: string, status: "in_progress" | "completed") => {
    const res = await updateContractWorkRequestStatus(requestId, status);
    if (res.success && contract?.id) loadRequests(contract.id);
    else alert(res.error ?? "상태 변경에 실패했습니다.");
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("이 업무를 삭제하시겠습니까? 승인된 경우 수정 횟수가 복구됩니다.")) return;
    const res = await deleteContractWorkRequest(requestId);
    if (res.success && contract?.id) loadRequests(contract.id);
    else alert(res.error ?? "삭제에 실패했습니다.");
  };

  const getStatusLabel = (s: string) => {
    const m: Record<string, string> = {
      pending: "승인요청",
      approved: "승인완료",
      rejected: "승인반려",
      in_progress: "작업중",
      completed: "작업완료",
      deleted: "삭제됨",
    };
    return m[s] ?? s;
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    const x = new Date(d);
    return `${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, "0")}.${String(x.getDate()).padStart(2, "0")}`;
  };

  return (
    <section className={`manageWork_regist page_section ${manageStyles.manageWorkRegist}`}>
      <div className="page_title">
        <h1>업무 등록</h1>
        <div className="btn_wrap">
          <button type="button" className="btn btn_lg normal">
            삭제
          </button>
          <button type="button" className="btn btn_lg primary">
            등록
          </button>
        </div>
      </div>

      <ContractSelectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handleSelectContract} />

      <div className="white_box">
        <div className={manageStyles.importBtnWrapper}>
          <button type="button" className="import_btn btn btn_md black" style={{ position: "relative", top: "0", right: "0", marginBottom: "40px" }} onClick={() => setIsModalOpen(true)}>
            계약 불러오기
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {isLoading && !contractData && <div className={styles.loading}>계약 정보를 불러오는 중...</div>}

        {contractData && contract && client && (
          <div className="box_inner">
            <div className="table_group">
              {/* ERP 정보 */}
              <div className="table_item">
                <h2 className="table_title">
                  ERP 정보
                  <button type="button" onClick={() => setErpOpen(!erpOpen)} className={manageStyles.toggleBtn}>
                    <Image src="/images/arrow_icon.svg" alt="" width={16} height={16} className={`${manageStyles.tableToggle} ${erpOpen ? manageStyles.rotated : ""}`} />
                  </button>
                </h2>
                {erpOpen && (
                  <div className="table_wrap on">
                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">아이디</div>
                        <div className="table_data">-</div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">패스워드</div>
                        <div className="table_data">-</div>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 기본 정보 */}
              <div className="table_item">
                <h2 className="table_title">
                  기본 정보
                  <button type="button" onClick={() => setBasicOpen(!basicOpen)} className={manageStyles.toggleBtn}>
                    <Image src="/images/arrow_icon.svg" alt="" width={16} height={16} className={`${manageStyles.tableToggle} ${basicOpen ? manageStyles.rotated : ""}`} />
                  </button>
                </h2>
                {basicOpen && (
                  <div className="table_wrap on">
                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">거래처 사업자등록번호</div>
                        <div className="table_data">{client.business_registration_number ?? "-"}</div>
                      </li>
                    </ul>
                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">상호(법인명)</div>
                        <div className="table_data">{client.name}</div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">대표자</div>
                        <div className="table_data">{client.ceo_name ?? "-"}</div>
                      </li>
                    </ul>
                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">사업자 주소</div>
                        <div className="table_data">{client.address ?? "-"}</div>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 담당자 정보 */}
              <div className="table_item">
                <h2 className="table_title">
                  담당자 정보
                  <button type="button" onClick={() => setContactOpen(!contactOpen)} className={manageStyles.toggleBtn}>
                    <Image src="/images/arrow_icon.svg" alt="" width={16} height={16} className={`${manageStyles.tableToggle} ${contactOpen ? manageStyles.rotated : ""}`} />
                  </button>
                </h2>
                {contactOpen && (
                  <div className="table_wrap">
                    <ul className="table_row" style={{ borderBottom: "1px solid var(--border-color)", marginBottom: "30px" }}>
                      <li className="row_group">
                        <div className="table_head">주 담당자</div>
                        <div className="table_data">{contract.primary_contact_name ?? "-"}</div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">부 담당자</div>
                        <div className="table_data">{contract.secondary_contact_name ?? "-"}</div>
                      </li>
                    </ul>
                    {contacts.length > 0 && (
                      <>
                        <h3 className="table_title_sub">연락처</h3>
                        {contacts.map((c, i) => (
                          <ul key={i} className="table_row">
                            <li className="row_group">
                              <div className="table_head">이름</div>
                              <div className="table_data">{c.name}</div>
                            </li>
                            <li className="row_group">
                              <div className="table_head">연락처</div>
                              <div className="table_data">{c.phone ?? "-"}</div>
                            </li>
                            <li className="row_group">
                              <div className="table_head">이메일</div>
                              <div className="table_data">{c.email ?? "-"}</div>
                            </li>
                          </ul>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 사이트 정보 */}
              <div className="table_item table_item2">
                <h2 className="table_title">
                  사이트 정보
                  <button type="button" onClick={() => setSiteOpen(!siteOpen)} className={manageStyles.toggleBtn}>
                    <Image src="/images/arrow_icon.svg" alt="" width={16} height={16} className={`${manageStyles.tableToggle} ${siteOpen ? manageStyles.rotated : ""}`} />
                  </button>
                </h2>
                {siteOpen && (
                  <div className="table_wrap">
                    {sites.length === 0 ? (
                      <div className="table_data" style={{ padding: "18px 20px" }}>
                        사이트 정보가 없습니다.
                      </div>
                    ) : (
                      <table className="site-table">
                        <colgroup>
                          <col style={{ width: "20%" }} />
                          <col style={{ width: "80%" }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th>브랜드</th>
                            <th>비고</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sites.map((s) => (
                            <tr key={s.id}>
                              <td data-th="브랜드">{s.brand_name ?? "-"}</td>
                              <td data-th="비고">-</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* 비고 */}
              <div className="table_item">
                <h2 className="table_title">
                  비고
                  <button type="button" onClick={() => setNoteOpen(!noteOpen)} className={manageStyles.toggleBtn}>
                    <Image src="/images/arrow_icon.svg" alt="" width={16} height={16} className={`${manageStyles.tableToggle} ${noteOpen ? manageStyles.rotated : ""}`} />
                  </button>
                </h2>
                {noteOpen && (
                  <div className="table_wrap">
                    <div className="text_box scroll">
                      <p>{contract.work_note ?? "-"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 업무 등록 */}
              <div className={`table_item table_item2 ${manageStyles.workRegistration}`}>
                <h2 className="table_title">
                  {contract.contract_name}{" "}
                  <div style={{ textAlign: "right", marginBottom: 12 }}>
                    <button type="button" onClick={addNewRow} className="plus_btn">
                      + 업무 추가
                    </button>
                  </div>
                </h2>
                <div className={styles.workContentsBar}>
                  {workContents.map((wc) => (
                    <div>
                      {" "}
                      <span key={wc.id} className={styles.workContentChip}>
                        <span className={styles.workContentHead}>{wc.work_content_name}</span>
                        <span>{wc.modification_count}회</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="table_wrap">
                  <table className={`${manageStyles.workTable} ${manageStyles.maintenanceTable} ${styles.contractWorkTable}`}>
                    <colgroup>
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "auto" }} />
                      <col style={{ width: "auto" }} />
                      <col style={{ width: "100px" }} />
                      <col style={{ width: "20px" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>브랜드</th>
                        <th>담당자</th>
                        <th>작업기간</th>
                        <th>첨부파일</th>
                        <th>작업유형</th>
                        <th>작업내용</th>
                        <th>메모</th>
                        <th>진행상황</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                        <tr key={r.id}>
                          <td data-th="브랜드">{r.brand_name}</td>
                          <td data-th="담당자">{r.manager}</td>
                          <td data-th="작업기간">{r.work_period ? formatDate(r.work_period) : "-"}</td>
                          <td data-th="첨부파일">
                            {r.attachment_name ? (
                              <a href={r.attachment_url ?? "#"} target="_blank" rel="noopener noreferrer">
                                {r.attachment_name}
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td data-th="작업유형">{r.work_content_name ?? "-"}</td>
                          <td data-th="작업내용" className={manageStyles.inputCell}>
                            {r.work_content ?? "-"}
                          </td>
                          <td data-th="메모" className={manageStyles.inputCell}>
                            {r.memo ?? "-"}
                          </td>
                          <td data-th="승인요청" className={manageStyles.buttonCell}>
                            {r.status === "pending" && <span className={manageStyles.approvalWait}>승인대기</span>}
                            {r.status === "approved" && (
                              <select
                                value=""
                                onChange={(e) => {
                                  const v = e.target.value as "in_progress" | "completed";
                                  if (v) handleStatusChange(r.id, v);
                                }}>
                                <option value="">선택</option>
                                <option value="in_progress">작업중</option>
                                <option value="completed">작업완료</option>
                              </select>
                            )}
                            {(r.status === "in_progress" || r.status === "completed") && (
                              <>
                                <span>{getStatusLabel(r.status)}</span>
                                {/* <button type="button" className="btn" onClick={() => handleDeleteRequest(r.id)}>
                                  <X size={18} />
                                </button> */}
                              </>
                            )}
                            {(r.status === "rejected" || r.status === "deleted") && <span>{getStatusLabel(r.status)}</span>}
                          </td>
                        </tr>
                      ))}
                      {newRows.map((row) => (
                        <tr key={row.id}>
                          <td data-th="브랜드" className={manageStyles.selectCell}>
                            <select value={row.brandName} onChange={(e) => updateNewRow(row.id, "brandName", e.target.value)}>
                              <option value="">선택</option>
                              {sites.map((s) => (
                                <option key={s.id} value={s.brand_name ?? ""}>
                                  {s.brand_name ?? ""}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td data-th="담당자" className={manageStyles.inputCell}>
                            <input type="text" value={row.manager} onChange={(e) => updateNewRow(row.id, "manager", e.target.value)} placeholder="담당자" />
                          </td>
                          <td data-th="작업기간" className={manageStyles.dateCell}>
                            <input type="date" value={row.workPeriod} onChange={(e) => updateNewRow(row.id, "workPeriod", e.target.value)} />
                          </td>
                          <td data-th="첨부파일" className={manageStyles.inputCell}>
                            <div className="file-upload-box">
                              <input type="file" className="fileInput" data-work-id={row.id} hidden onChange={(e) => updateNewRow(row.id, "attachment", e.target.files?.[0] ?? null)} />
                              {!row.attachment ? (
                                <div className="file-upload-btn" onClick={() => (document.querySelector(`.fileInput[data-work-id="${row.id}"]`) as HTMLInputElement)?.click()}>
                                  <span>첨부파일</span>
                                  <Image src="/images/attach_icon.svg" alt="" width={12} height={12} style={{ display: "inline-block", margin: 0 }} />
                                </div>
                              ) : (
                                <div className={manageStyles.fileNameContainer}>
                                  <span className="fileName">{row.attachment.name}</span>
                                  <button
                                    type="button"
                                    className={manageStyles.fileRemoveBtn}
                                    onClick={() => {
                                      updateNewRow(row.id, "attachment", null);
                                      const input = document.querySelector(`.fileInput[data-work-id="${row.id}"]`) as HTMLInputElement;
                                      if (input) input.value = "";
                                    }}>
                                    <Image src="/images/close_icon.svg" alt="제거" width={14} height={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td data-th="작업유형" className={manageStyles.selectCell}>
                            <select value={row.contractWorkContentId} onChange={(e) => updateNewRow(row.id, "contractWorkContentId", e.target.value)}>
                              {workContents.map((wc) => (
                                <option key={wc.id} value={wc.id}>
                                  {wc.work_content_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td data-th="작업내용" className={manageStyles.inputCell}>
                            <input type="text" value={row.workContent} onChange={(e) => updateNewRow(row.id, "workContent", e.target.value)} placeholder="작업내용" />
                          </td>
                          <td data-th="메모" className={manageStyles.inputCell}>
                            <input type="text" value={row.memo} onChange={(e) => updateNewRow(row.id, "memo", e.target.value)} placeholder="메모" />
                          </td>
                          <td data-th="승인요청" className={manageStyles.buttonCell}>
                            <div>
                              <button type="button" className={`btn  ${manageStyles.approvalRequest}`} onClick={() => handleSubmitRequest(row)} disabled={isLoading}>
                                승인요청
                              </button>
                            </div>
                          </td>
                          <td data-th="" className={manageStyles.buttonCell} style={{ paddingLeft: "0", paddingRight: "0", paddingTop: "32px" }}>
                            <button type="button" className={`btn`} onClick={() => removeNewRow(row.id)}>
                              <X size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {!contractData && !isLoading && <div className={styles.empty}>계약 불러오기를 선택한 뒤 계약을 선택해 주세요.</div>}
      </div>
    </section>
  );
}
