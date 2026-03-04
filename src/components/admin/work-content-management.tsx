"use client";

import { useState, useEffect } from "react";
import styles from "./work-content-management.module.css";
import { getContractTypes, getWorkContentsByContractType, createContractType, updateContractType, deleteContractType, createWorkContent, updateWorkContent, deleteWorkContent } from "@/app/actions/contract-type";

type ContractType = {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
};

type WorkContent = {
  id: string;
  work_content_name: string;
  display_order: number;
  is_active: boolean;
  default_modification_count?: number | null;
};

export function WorkContentManagement() {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [workContents, setWorkContents] = useState<Record<string, WorkContent[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 편집 상태
  const [editingContractType, setEditingContractType] = useState<string | null>(null);
  const [editingWorkContent, setEditingWorkContent] = useState<string | null>(null);
  const [newContractTypeName, setNewContractTypeName] = useState("");
  const [newWorkContentName, setNewWorkContentName] = useState<Record<string, string>>({});
  const [newWorkContentCount, setNewWorkContentCount] = useState<Record<string, number>>({});

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // 계약 종목 목록 조회
      const typesResult = await getContractTypes();
      if (!typesResult.success || !typesResult.data) {
        throw new Error(typesResult.error || "계약 종목을 불러오는데 실패했습니다.");
      }

      setContractTypes(typesResult.data);

      // 각 계약 종목별 작업 내용 조회
      const contentsMap: Record<string, WorkContent[]> = {};
      for (const type of typesResult.data) {
        const contentsResult = await getWorkContentsByContractType(type.id);
        if (contentsResult.success && contentsResult.data) {
          contentsMap[type.id] = contentsResult.data;
        }
      }
      setWorkContents(contentsMap);
    } catch (err: any) {
      setError(err.message || "데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 계약 종목 추가
  const handleAddContractType = async () => {
    if (!newContractTypeName.trim()) {
      setError("계약 종목명을 입력해주세요.");
      return;
    }

    const maxOrder = contractTypes.length > 0 ? Math.max(...contractTypes.map((t) => t.display_order)) : 0;

    const result = await createContractType(newContractTypeName.trim(), maxOrder + 1);
    if (result.success) {
      setNewContractTypeName("");
      setSuccess("계약 종목이 추가되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
      await loadData();
    } else {
      setError(result.error || "계약 종목 추가에 실패했습니다.");
    }
  };

  // 계약 종목 수정
  const handleUpdateContractType = async (id: string, name: string, displayOrder: number, isActive: boolean) => {
    const result = await updateContractType(id, name, displayOrder, isActive);
    if (result.success) {
      setEditingContractType(null);
      setSuccess("계약 종목이 수정되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
      await loadData();
    } else {
      setError(result.error || "계약 종목 수정에 실패했습니다.");
    }
  };

  // 계약 종목 삭제
  const handleDeleteContractType = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 사용 중인 계약 종목은 삭제할 수 없습니다.")) {
      return;
    }

    const result = await deleteContractType(id);
    if (result.success) {
      setSuccess("계약 종목이 삭제되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
      await loadData();
    } else {
      setError(result.error || "계약 종목 삭제에 실패했습니다.");
    }
  };

  // 작업 내용 추가
  const handleAddWorkContent = async (contractTypeId: string) => {
    const name = newWorkContentName[contractTypeId]?.trim();
    if (!name) {
      setError("작업 내용명을 입력해주세요.");
      return;
    }

    const existingContents = workContents[contractTypeId] || [];
    const maxOrder = existingContents.length > 0 ? Math.max(...existingContents.map((w) => w.display_order)) : 0;
    const count = Math.max(0, Math.floor(newWorkContentCount[contractTypeId] ?? 0));

    const result = await createWorkContent(contractTypeId, name, maxOrder + 1, count);
    if (result.success) {
      setNewWorkContentName({ ...newWorkContentName, [contractTypeId]: "" });
      setNewWorkContentCount({ ...newWorkContentCount, [contractTypeId]: 0 });
      setSuccess("작업 내용이 추가되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
      await loadData();
    } else {
      setError(result.error || "작업 내용 추가에 실패했습니다.");
    }
  };

  // 작업 내용 수정
  const handleUpdateWorkContent = async (id: string, workContentName: string, displayOrder: number, isActive: boolean, defaultModificationCount?: number) => {
    const result = await updateWorkContent(id, workContentName, displayOrder, isActive, defaultModificationCount);
    if (result.success) {
      setEditingWorkContent(null);
      setSuccess("작업 내용이 수정되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
      await loadData();
    } else {
      setError(result.error || "작업 내용 수정에 실패했습니다.");
    }
  };

  // 작업 내용 삭제
  const handleDeleteWorkContent = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 사용 중인 작업 내용은 삭제할 수 없습니다.")) {
      return;
    }

    const result = await deleteWorkContent(id);
    if (result.success) {
      setSuccess("작업 내용이 삭제되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
      await loadData();
    } else {
      setError(result.error || "작업 내용 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <section className="page_section">
        <div className="page_title">
          <h1>작업 내용 관리</h1>
        </div>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>로딩 중...</div>
      </section>
    );
  }

  return (
    <section className="page_section">
      <div className="page_title">
        <h1>작업 내용 관리</h1>
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

      {success && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 14px",
            backgroundColor: "#efe",
            border: "1px solid #cfc",
            borderRadius: "6px",
            color: "var(--positive)",
            fontSize: "13px",
          }}>
          {success}
        </div>
      )}

      <div className="white_box">
        {/* 계약 종목 추가 */}
        <div style={{ marginBottom: "40px", paddingBottom: "40px", borderBottom: "1px solid var(--border-color)" }}>
          <h2 className={styles.table_title} style={{ marginBottom: "15px" }}>
            계약 종목 추가
          </h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              value={newContractTypeName}
              onChange={(e) => setNewContractTypeName(e.target.value)}
              placeholder="계약 종목명을 입력하세요"
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
              style={{ maxWidth: "300px" }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddContractType();
                }
              }}
            />
            <button type="button" onClick={handleAddContractType} className="btn btn_lg primary">
              추가
            </button>
          </div>
        </div>

        <h2 className={styles.table_title} style={{ borderBottom: "1px solid var(--border-color)", marginBottom: "0", paddingBottom: "15px" }}>
          계약 종목 별 작업 내용 설정
        </h2>
        <div className={styles.table_head}>
          <p>계약 종목</p>
          <p>작업 내용</p>
        </div>
        {/* 계약 종목 목록 */}
        {contractTypes.map((type) => (
          <div key={type.id} className={styles.table_box}>
            <div className={styles.box_left} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", position: "relative" }}>
              <h3 className="table_title_sub">
                {editingContractType === type.id ? (
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input type="text" defaultValue={type.name} id={`type-name-${type.id}`} className="border border-slate-200 rounded px-3 py-2 text-sm" style={{ width: "200px" }} />
                    <input type="number" defaultValue={type.display_order} id={`type-order-${type.id}`} className="border border-slate-200 rounded px-3 py-2 text-sm" style={{ width: "50px" }} />
                    <span style={{ fontSize: "13px" }}>번</span>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", marginLeft: "6px" }}>
                      <input type="checkbox" defaultChecked={type.is_active} id={`type-active-${type.id}`} />
                      활성화
                    </label>
                    <div className={styles.btn_wrap} style={{ position: "absolute", right: "0" }}>
                      {" "}
                      <button
                        type="button"
                        onClick={() => {
                          const nameInput = document.getElementById(`type-name-${type.id}`) as HTMLInputElement;
                          const orderInput = document.getElementById(`type-order-${type.id}`) as HTMLInputElement;
                          const activeInput = document.getElementById(`type-active-${type.id}`) as HTMLInputElement;
                          handleUpdateContractType(type.id, nameInput.value, parseInt(orderInput.value), activeInput.checked);
                        }}>
                        <img src="/images/check_icon_g.png" alt="저장 아이콘" />
                      </button>
                      <button type="button" onClick={() => setEditingContractType(null)}>
                        <img src="/images/close_icon_g.png" alt="취소 아이콘" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span className={styles.sub_name}>{type.name}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-gray)" }}>(순서: {type.display_order})</span>
                    {!type.is_active && <span style={{ fontSize: "12px", color: "#999" }}>(비활성)</span>}
                  </div>
                )}
              </h3>
              {editingContractType !== type.id && (
                <div className={styles.btn_wrap} style={{ right: "0" }}>
                  <button type="button" onClick={() => setEditingContractType(type.id)}>
                    <img src="/images/modify_icon.png" alt="수정 아이콘" />
                  </button>
                  <button type="button" onClick={() => handleDeleteContractType(type.id)}>
                    <img src="/images/close_icon_g.png" alt="삭제 아이콘" />
                  </button>
                </div>
              )}
            </div>

            {/* 작업 내용 목록 */}
            <div className={styles.box_right}>
              <div style={{ marginBottom: "15px" }}>
                {/*<h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px" }}>작업 내용</h4>*/}

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(workContents[type.id] || []).map((workContent) => (
                    <div key={workContent.id} className={styles.work_list}>
                      {editingWorkContent === workContent.id ? (
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flex: 1, position: "relative", flexDirection: "column" }}>
                          <div style={{ gap: "10px", display: "flex", alignItems: "center" }}>
                            <input type="text" defaultValue={workContent.work_content_name} id={`work-name-${workContent.id}`} className="border border-slate-200 rounded px-3 py-2 text-sm" style={{ width: "260px" }} />
                            <input type="number" defaultValue={workContent.display_order} id={`work-order-${workContent.id}`} className="border border-slate-200 rounded px-3 py-2 text-sm" style={{ width: "50px" }} />
                            <span style={{ fontSize: "13px" }}>번</span>
                          </div>
                          <div style={{ gap: "10px", display: "flex", alignItems: "center" }}>
                            {" "}
                            <span style={{ fontSize: "13px" }}>기본 횟수 :</span>
                            <input type="number" defaultValue={workContent.default_modification_count ?? 0} id={`work-count-${workContent.id}`} min={0} className="border border-slate-200 rounded px-3 py-2 text-sm" style={{ width: "60px" }} />
                            <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px" }}>
                              <input type="checkbox" defaultChecked={workContent.is_active} id={`work-active-${workContent.id}`} />
                              활성화
                            </label>
                          </div>

                          <div className={styles.btn_wrap} style={{ position: "absolute", right: "-40px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                const nameInput = document.getElementById(`work-name-${workContent.id}`) as HTMLInputElement;
                                const orderInput = document.getElementById(`work-order-${workContent.id}`) as HTMLInputElement;
                                const countInput = document.getElementById(`work-count-${workContent.id}`) as HTMLInputElement;
                                const activeInput = document.getElementById(`work-active-${workContent.id}`) as HTMLInputElement;
                                const count = countInput ? Math.max(0, parseInt(countInput.value, 10) || 0) : undefined;
                                handleUpdateWorkContent(workContent.id, nameInput.value, parseInt(orderInput.value, 10), activeInput.checked, count);
                              }}>
                              <img src="/images/check_icon_g.png" alt="저장 아이콘" />
                            </button>
                            <button type="button" onClick={() => setEditingWorkContent(null)}>
                              <img src="/images/close_icon_g.png" alt="취소 아이콘" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center", position: "relative", flexWrap: "wrap" }}>
                            <span className={styles.work_name}>{workContent.work_content_name}</span>
                            <span style={{ fontSize: "13px", color: "var(--text-gray)" }}>(순서: {workContent.display_order})</span>
                            <span style={{ fontSize: "13px", color: "var(--text-gray)" }}>(기본 횟수: {workContent.default_modification_count ?? 0}회)</span>
                            {!workContent.is_active && <span style={{ fontSize: "12px", color: "#999" }}>(비활성)</span>}
                          </div>
                          <div className={styles.btn_wrap}>
                            <button type="button" onClick={() => setEditingWorkContent(workContent.id)}>
                              <img src="/images/modify_icon.png" alt="수정 아이콘" />
                            </button>
                            <button type="button" onClick={() => handleDeleteWorkContent(workContent.id)}>
                              <img src="/images/close_icon_g.png" alt="삭제 아이콘" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles.add_form} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    value={newWorkContentName[type.id] || ""}
                    onChange={(e) => setNewWorkContentName({ ...newWorkContentName, [type.id]: e.target.value })}
                    placeholder="작업 내용명을 입력하세요"
                    className="border border-slate-200 rounded px-3 py-2 text-sm"
                    style={{ flex: "1" }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddWorkContent(type.id);
                      }
                    }}
                  />
                  <span style={{ fontSize: "13px" }}>기본 횟수 : </span>
                  <input type="number" min={0} value={newWorkContentCount[type.id] ?? ""} onChange={(e) => setNewWorkContentCount({ ...newWorkContentCount, [type.id]: parseInt(e.target.value, 10) || 0 })} className="border border-slate-200 rounded px-3 py-2 text-sm" style={{ width: "54px" }} placeholder="0" />
                  <button type="button" onClick={() => handleAddWorkContent(type.id)} className="btn btn_md primary">
                    추가
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
