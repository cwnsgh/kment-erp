"use client";

import { X, Paperclip } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createConsultation,
  updateConsultation,
  type ConsultationCategory,
  type CreateConsultationInput,
  type ConsultationDetail,
} from "@/app/actions/consultation";
import { formatAmountInput, parseAmountInput } from "@/lib/format-amount";
import styles from "./consultation-registration-form.module.css";

const createId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

/** 연락처 입력: 숫자만 저장, 표시는 010-1234-5678 형식 (최대 11자리) */
function formatPhoneDisplay(value: string): string {
  const digits = (value ?? "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
function parsePhoneInput(value: string): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 11);
}

const SOLUTION_OPTIONS = ["선택해주세요", "카페24", "고도몰", "기타"];
const SITE_TYPE_OPTIONS = ["선택해주세요", "신규", "리뉴얼", "이전", "개발", "유지보수", "기타"];

type ContactRow = { id: string; name: string; email: string; phone: string; note: string };
type SiteRow = { id: string; brand: string; domain: string; solution: string; type: string };

type Props = {
  categories: ConsultationCategory[];
  mode?: "new" | "edit";
  initialData?: ConsultationDetail | null;
};

export function ConsultationRegistrationForm({ categories, mode = "new", initialData }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [brand, setBrand] = useState("");
  const [budget, setBudget] = useState("");
  const [generalRemarks, setGeneralRemarks] = useState("");
  const [consultationDate, setConsultationDate] = useState("");
  const [consultationContent, setConsultationContent] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([{ id: createId(), name: "", email: "", phone: "", note: "" }]);
  const [sites, setSites] = useState<SiteRow[]>([{ id: createId(), brand: "", domain: "", solution: "", type: "" }]);
  const [attachments, setAttachments] = useState<Array<{ fileUrl: string; fileName: string; fileSize?: number }>>([]);

  const isEdit = mode === "edit" && initialData?.id;

  useEffect(() => {
    if (!initialData) return;
    setCompanyName(initialData.company_name ?? "");
    setIndustry(initialData.industry ?? "");
    setBrand(initialData.brand ?? "");
    setBudget(initialData.budget ?? "");
    setGeneralRemarks(initialData.general_remarks ?? "");
    setConsultationDate(initialData.consultation_date ? String(initialData.consultation_date).slice(0, 10) : "");
    setConsultationContent(initialData.consultation_content ?? "");
    setCategoryIds(initialData.category_ids ?? []);
    setContacts(
      initialData.contacts?.length
        ? initialData.contacts.map((c) => ({
            id: createId(),
            name: c.name ?? "",
            email: c.email ?? "",
            phone: c.phone ?? "",
            note: c.note ?? "",
          }))
        : [{ id: createId(), name: "", email: "", phone: "", note: "" }]
    );
    setSites(
      initialData.sites?.length
        ? initialData.sites.map((s) => ({
            id: createId(),
            brand: s.brand ?? "",
            domain: s.domain ?? "",
            solution: s.solution ?? "",
            type: s.type ?? "",
          }))
        : [{ id: createId(), brand: "", domain: "", solution: "", type: "" }]
    );
    setAttachments(
      initialData.attachments?.map((a) => ({ fileUrl: a.file_url, fileName: a.file_name ?? "", fileSize: a.file_size ?? undefined })) ?? []
    );
  }, [initialData?.id]);

  const addContact = () => setContacts((prev) => [...prev, { id: createId(), name: "", email: "", phone: "", note: "" }]);
  const removeContact = (id: string) => setContacts((prev) => prev.filter((c) => c.id !== id));

  const addSite = () => setSites((prev) => [...prev, { id: createId(), brand: "", domain: "", solution: "", type: "" }]);
  const removeSite = (id: string) => setSites((prev) => prev.filter((s) => s.id !== id));

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "consultation-attachments");
      const res = await fetch("/api/files/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success && json.url) {
        setAttachments((prev) => [...prev, { fileUrl: json.url, fileName: json.fileName ?? file.name, fileSize: file.size }]);
      } else {
        alert(json.error || "업로드 실패");
      }
    } catch (err) {
      alert("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (index: number) => setAttachments((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const input: CreateConsultationInput = {
        companyName,
        industry,
        brand,
        budget: parseAmountInput(budget),
        generalRemarks,
        consultationDate,
        consultationContent,
        categoryIds,
        contacts: contacts.map((c) => ({ name: c.name, email: c.email, phone: c.phone, note: c.note })),
        sites: sites.map((s) => ({ brand: s.brand, domain: s.domain, solution: s.solution === "선택해주세요" ? "" : s.solution, type: s.type === "선택해주세요" ? "" : s.type })),
        attachments,
      };
      if (isEdit) {
        const result = await updateConsultation(initialData!.id, input);
        if (result.success) {
          router.push("/consultation");
          router.refresh();
        } else {
          alert(result.error || "수정에 실패했습니다.");
        }
      } else {
        const result = await createConsultation(input);
        if (result.success) {
          router.push("/consultation");
          router.refresh();
        } else {
          alert(result.error || "등록에 실패했습니다.");
        }
      }
    } catch (err) {
      alert(isEdit ? "수정 중 오류가 발생했습니다." : "등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`${styles.consultationPage} page_section`}>
      <div className="page_title">
        <h1>{isEdit ? "상담 수정" : "상담 등록"}</h1>
        <div className="btn_wrap">
          <button type="submit" form="consultation-registration-form" className="btn btn_lg primary" disabled={loading}>
            {loading ? (isEdit ? "저장 중..." : "등록 중...") : isEdit ? "저장" : "등록"}
          </button>
        </div>
      </div>
      <div className={styles.whiteBox}>
        <div className={styles.boxInner}>
          <form id="consultation-registration-form" onSubmit={handleSubmit} className={`table_group ${styles.root}`}>
            {/* 1. 기본 정보 */}
            <div className="table_item">
              <h2 className="table_title">기본 정보</h2>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">상호(법인명)</div>
                  <div className="table_data pd12">
                    <input type="text" placeholder="상호(법인명)" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  </div>
                </li>
                <li className="row_group">
                  <div className="table_head">업종</div>
                  <div className="table_data pd12">
                    <input type="text" placeholder="업종" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">브랜드</div>
                  <div className="table_data pd12">
                    <input type="text" placeholder="브랜드" value={brand} onChange={(e) => setBrand(e.target.value)} />
                  </div>
                </li>
                <li className="row_group">
                  <div className="table_head">예산</div>
                  <div className="table_data pd12">
                    <input type="text" inputMode="numeric" placeholder="예산 (예: 1,000,000)" value={formatAmountInput(budget)} onChange={(e) => setBudget(parseAmountInput(e.target.value))} />
                  </div>
                </li>
              </ul>
            </div>

            {/* 2. 담당자 정보 */}
            <div className="table_item">
              <h2 className="table_title">
                담당자 정보
                <button type="button" onClick={addContact} className="plus_btn">
                  + 담당자 추가
                </button>
              </h2>
              {contacts.map((contact, index) => (
                <div key={contact.id} className={styles.contactBlock}>
                  <div className={styles.contactBlockHeader}>
                    <h3 className="table_title_sub">담당자 {index + 1}</h3>
                    {contacts.length > 1 && (
                      <button type="button" onClick={() => removeContact(contact.id)} className={styles.removeBtnHeader} title="삭제">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">이름</div>
                      <div className="table_data pd12">
                        <input type="text" placeholder="이름" value={contact.name} onChange={(e) => setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, name: e.target.value } : c)))} />
                      </div>
                    </li>
                    <li className="row_group">
                      <div className="table_head">이메일</div>
                      <div className="table_data pd12">
                        <input type="email" placeholder="이메일" value={contact.email} onChange={(e) => setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, email: e.target.value } : c)))} />
                      </div>
                    </li>
                  </ul>
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">연락처</div>
                      <div className="table_data pd12">
                        <input type="tel" inputMode="tel" placeholder="010-1234-5678" value={formatPhoneDisplay(contact.phone)} onChange={(e) => setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, phone: parsePhoneInput(e.target.value) } : c)))} />
                      </div>
                    </li>
                    <li className="row_group">
                      <div className="table_head">비고</div>
                      <div className="table_data pd12">
                        <input type="text" placeholder="비고" value={contact.note} onChange={(e) => setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, note: e.target.value } : c)))} />
                      </div>
                    </li>
                  </ul>
                </div>
              ))}
            </div>

            {/* 3. 사이트 정보 - 2행 배치로 필드 너비 확보 (브랜드/도메인 | 솔루션/유형) */}
            <div className="table_item">
              <h2 className="table_title">
                사이트 정보
                <button type="button" onClick={addSite} className="plus_btn">
                  + 사이트 추가
                </button>
              </h2>
              {sites.map((site, index) => (
                <div key={site.id} className={styles.siteBlock}>
                  {sites.length > 1 && (
                    <div className={styles.siteBlockHeader}>
                      <span className="table_title_sub">사이트 {index + 1}</span>
                      <button type="button" onClick={() => removeSite(site.id)} className={styles.removeBtnHeader} title="삭제">
                        <X size={18} />
                      </button>
                    </div>
                  )}
                  <ul className={`table_row ${styles.siteRow}`}>
                    <li className="row_group">
                      <div className="table_head">브랜드</div>
                      <div className="table_data pd12">
                        <input type="text" placeholder="브랜드" value={site.brand} onChange={(e) => setSites((prev) => prev.map((s) => (s.id === site.id ? { ...s, brand: e.target.value } : s)))} />
                      </div>
                    </li>
                    <li className="row_group">
                      <div className="table_head">도메인</div>
                      <div className="table_data pd12">
                        <input type="text" placeholder="도메인" value={site.domain} onChange={(e) => setSites((prev) => prev.map((s) => (s.id === site.id ? { ...s, domain: e.target.value } : s)))} />
                      </div>
                    </li>
                  </ul>
                  <ul className={`table_row ${styles.siteRow}`}>
                    <li className="row_group">
                      <div className="table_head">솔루션</div>
                      <div className="table_data pd12">
                        <select value={site.solution || "선택해주세요"} onChange={(e) => setSites((prev) => prev.map((s) => (s.id === site.id ? { ...s, solution: e.target.value } : s)))}>
                          {SOLUTION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </li>
                    <li className="row_group">
                      <div className="table_head">유형</div>
                      <div className="table_data pd12">
                        <select value={site.type || "선택해주세요"} onChange={(e) => setSites((prev) => prev.map((s) => (s.id === site.id ? { ...s, type: e.target.value } : s)))}>
                          {SITE_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </li>
                  </ul>
                </div>
              ))}
            </div>

            {/* 4. 비고 */}
            <div className="table_item">
              <h2 className="table_title">비고</h2>
              <li className={`${styles.fullRow}`}>
                <textarea placeholder="상담 등록 비고 내용입니다." value={generalRemarks} onChange={(e) => setGeneralRemarks(e.target.value)} rows={4} />
              </li>
            </div>

            {/* 5. 상담 내용 - 구분 → 상담일자 → 상담내용 → 첨부파일 순, 각각 한 줄 */}
            <div className="table_item">
              <h2 className="table_title">상담 내용</h2>
              <ul className="table_row">
                <li className={`row_group ${styles.fullRow}`}>
                  <div className="table_head">구분</div>
                  <div className={`table_data pd12 ${styles.categoryCell}`}>
                    <div className={styles.categoryGroup}>
                      {categories.map((cat) => (
                        <label key={cat.id} className={styles.categoryCheckbox}>
                          <input type="checkbox" checked={categoryIds.includes(cat.id)} onChange={() => toggleCategory(cat.id)} />
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">상담일자</div>
                  <div className="table_data pd12">
                    <input type="date" value={consultationDate} onChange={(e) => setConsultationDate(e.target.value)} style={{ width: "auto" }} />
                  </div>
                </li>
              </ul>

              <ul className="table_row">
                <li className={`row_group ${styles.fullRow}`}>
                  <div className="table_head">상담내용</div>
                  <div className="table_data pd12">
                    <textarea className={styles.contentArea} placeholder="상담 내용을 입력하세요." value={consultationContent} onChange={(e) => setConsultationContent(e.target.value)} rows={6} />
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">첨부파일</div>
                  <div className="table_data pd12" style={{ flexDirection: "row", alignItems: "center" }}>
                    <input ref={fileInputRef} type="file" accept="*/*" className={styles.fileInputHidden} onChange={handleFileSelect} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`file-upload-btn`} disabled={uploading}>
                      {uploading ? "업로드 중..." : "첨부파일"}
                      <img src="/images/attach_icon.svg" alt="첨부" width={16} height={16} />
                    </button>
                    {attachments.length > 0 && (
                      <ul className={styles.attachmentList}>
                        {attachments.map((a, i) => (
                          <li key={i} className={styles.attachmentItem}>
                            <a href={a.fileUrl} target="_blank" rel="noopener noreferrer">
                              {a.fileName}
                            </a>
                            <button type="button" onClick={() => removeAttachment(i)} className={styles.removeBtn}>
                              <X size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
