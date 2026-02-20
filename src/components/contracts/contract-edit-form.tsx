"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateContract } from "@/app/actions/contract";
import { getActiveContractTypes } from "@/app/actions/contract-type";
import { getAllEmployees } from "@/app/actions/work-request";
import { formatAmountInput, parseAmountInput } from "@/lib/format-amount";
import styles from "./contract-form.module.css";

type ContractDetailForEdit = {
  contract: {
    id: string;
    contract_type_id: string;
    contract_name: string;
    contract_date: string;
    contract_type_name: string;
    draft_due_date: string | null;
    demo_due_date: string | null;
    final_completion_date: string | null;
    open_due_date: string | null;
    contract_amount: number;
    payment_progress: string;
    installment_amount: number | null;
    contract_note: string | null;
    contract_functionality: string | null;
    work_note: string | null;
    primary_contact: string | null;
    secondary_contact: string | null;
    primary_contact_name: string | null;
    secondary_contact_name: string | null;
  };
  client: { name: string };
};

type ContractEditFormProps = {
  detail: ContractDetailForEdit;
  contractId: string;
};

function toInputDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return d.toISOString().slice(0, 10);
}

export function ContractEditForm({ detail, contractId }: ContractEditFormProps) {
  const router = useRouter();
  const c = detail.contract;
  const [loading, setLoading] = useState(false);
  const [contractTypes, setContractTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState("");
  const [contractTypeId, setContractTypeId] = useState(String(c.contract_type_id ?? ""));
  const [contractAmountRaw, setContractAmountRaw] = useState(() =>
    parseAmountInput(String(c.contract_amount ?? ""))
  );
  const [installmentAmountRaw, setInstallmentAmountRaw] = useState(() =>
    parseAmountInput(String(c.installment_amount ?? ""))
  );

  useEffect(() => {
    const load = async () => {
      const [typeRes, empRes] = await Promise.all([getActiveContractTypes(), getAllEmployees()]);
      if (typeRes.success && typeRes.data) setContractTypes(typeRes.data);
      if (empRes.success && empRes.data) setEmployees(empRes.data);
    };
    load();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    const contractName = (formData.get("contract_name") as string)?.trim();
    const contractDate = formData.get("contract_date") as string;
    const contractTypeId = formData.get("contract_type_id") as string;
    const primaryContact = formData.get("primary_contact") as string;

    if (!contractName) {
      setError("계약명을 입력해주세요.");
      return;
    }
    if (!contractDate) {
      setError("계약일을 입력해주세요.");
      return;
    }
    if (!contractTypeId) {
      setError("계약 종목을 선택해주세요.");
      return;
    }
    if (!primaryContact) {
      setError("주 담당자를 선택해주세요.");
      return;
    }

    const paymentProgress = formData.get("payment_progress") as "paid" | "installment" | "unpaid";
    const installmentAmount = formData.get("installment_amount");
    setLoading(true);

    const result = await updateContract(contractId, {
      contract_name: contractName,
      contract_date: contractDate,
      contract_type_id: contractTypeId,
      draft_due_date: (formData.get("draft_due_date") as string) || null,
      demo_due_date: (formData.get("demo_due_date") as string) || null,
      final_completion_date: (formData.get("final_completion_date") as string) || null,
      open_due_date: (formData.get("open_due_date") as string) || null,
      contract_amount: Number(formData.get("contract_amount")) || 0,
      payment_progress: paymentProgress || "unpaid",
      installment_amount: installmentAmount ? Number(installmentAmount) : null,
      contract_note: (formData.get("contract_note") as string) || null,
      contract_functionality: (formData.get("contract_functionality") as string) || null,
      work_note: (formData.get("work_note") as string) || null,
      primary_contact: primaryContact,
      secondary_contact: (formData.get("secondary_contact") as string) || null,
    });

    setLoading(false);
    if (result.success) {
      router.push("/contracts");
      router.refresh();
    } else {
      setError(result.error || "수정에 실패했습니다.");
    }
  };

  return (
    <section className={`contract_regist page_section ${styles.contractRegist}`}>
      <div className="page_title">
        <h1>계약 수정</h1>
        <div className="btn_wrap">
          <button type="button" onClick={() => router.push("/contracts")} className="btn btn_lg normal">
            목록
          </button>
          <button type="submit" form="contractEditForm" disabled={loading} className="btn btn_lg primary">
            {loading ? "수정 중..." : "수정"}
          </button>
        </div>
      </div>

      <form id="contractEditForm" onSubmit={handleSubmit}>
        <div className="white_box">
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

          <div className="box_inner">
            <div className="table_group">
              {/* 거래처 정보 - 등록 폼과 동일 구조 */}
              <div className="table_item">
                <h2 className="table_title">거래처 정보</h2>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">거래처명</div>
                    <div className="table_data">{detail.client.name}</div>
                  </li>
                </ul>
              </div>

              {/* 계약 정보 - 등록 폼과 동일한 행/열 구조 */}
              <div className="table_item">
                <h2 className="table_title">계약 정보</h2>

                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">계약명</div>
                    <div className="table_data">
                      <input
                        name="contract_name"
                        type="text"
                        defaultValue={c.contract_name}
                        required
                        placeholder="계약명을 입력하세요"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">계약일</div>
                    <div className="table_data">
                      <input
                        name="contract_date"
                        type="date"
                        defaultValue={toInputDate(c.contract_date)}
                        required
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </li>
                </ul>

                <ul className="table_row">
                  <li className="row_group" style={{ width: "100%" }}>
                    <div className="table_head">계약 종목</div>
                    <div className="table_data">
                      <select
                        name="contract_type_id"
                        required
                        value={contractTypeId}
                        onChange={(e) => setContractTypeId(e.target.value)}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm">
                        <option value="">계약 종목을 선택하세요</option>
                        {contractTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
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
                      <input
                        name="draft_due_date"
                        type="date"
                        defaultValue={toInputDate(c.draft_due_date)}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">데모 완료 예정일</div>
                    <div className="table_data">
                      <input
                        name="demo_due_date"
                        type="date"
                        defaultValue={toInputDate(c.demo_due_date)}
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
                        name="final_completion_date"
                        type="date"
                        defaultValue={toInputDate(c.final_completion_date)}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">오픈 예정일</div>
                    <div className="table_data">
                      <input
                        name="open_due_date"
                        type="date"
                        defaultValue={toInputDate(c.open_due_date)}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </li>
                </ul>

                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">계약금액</div>
                    <div className="table_data">
                      <input type="hidden" name="contract_amount" value={contractAmountRaw} />
                      <input
                        type="text"
                        value={formatAmountInput(contractAmountRaw)}
                        onChange={(e) => setContractAmountRaw(parseAmountInput(e.target.value))}
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
                          name="payment_progress"
                          defaultValue={c.payment_progress}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                          style={{ width: "120px" }}>
                          <option value="paid">완납</option>
                          <option value="unpaid">미납</option>
                          <option value="installment">분납</option>
                        </select>
                        <input type="hidden" name="installment_amount" value={installmentAmountRaw} />
                        <input
                          type="text"
                          value={formatAmountInput(installmentAmountRaw)}
                          onChange={(e) => setInstallmentAmountRaw(parseAmountInput(e.target.value))}
                          placeholder="분납 금액"
                          className="border border-slate-200 rounded px-3 py-2 text-sm"
                          style={{ width: "150px" }}
                        />
                      </div>
                    </div>
                  </li>
                </ul>

                <ul className="table_row">
                  <li className="row_group" style={{ width: "100%" }}>
                    <div className="table_head">계약 비고</div>
                    <div className="table_data">
                      <textarea
                        name="contract_note"
                        rows={3}
                        defaultValue={c.contract_note ?? ""}
                        placeholder="계약 비고를 입력하세요"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </li>
                </ul>

                <ul className="table_row">
                  <li className="row_group" style={{ width: "100%" }}>
                    <div className="table_head">계약 기능성</div>
                    <div className="table_data">
                      <textarea
                        name="contract_functionality"
                        rows={3}
                        defaultValue={c.contract_functionality ?? ""}
                        placeholder="계약 기능성을 입력하세요"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </li>
                </ul>

                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">주 담당자</div>
                    <div className="table_data">
                      <select
                        name="primary_contact"
                        required
                        defaultValue={c.primary_contact ?? ""}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm">
                        <option value="">선택하세요</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">부 담당자</div>
                    <div className="table_data">
                      <select
                        name="secondary_contact"
                        defaultValue={c.secondary_contact ?? ""}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm">
                        <option value="">선택하세요 (선택사항)</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
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
                        name="work_note"
                        rows={3}
                        defaultValue={c.work_note ?? ""}
                        placeholder="업무 비고를 입력하세요"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
