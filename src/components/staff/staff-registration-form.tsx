"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createStaff,
  updateStaff,
  updateStaffPassword,
  deactivateStaff,
  type CreateStaffInput,
  type StaffDetail,
} from "@/app/actions/staff";
import { formatPhoneDisplay } from "@/lib/staff-utils";
import styles from "./staff-registration-form.module.css";

const JOB_TYPE_OPTIONS = ["디자인", "퍼블리싱", "개발", "마케팅"];
const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "employed", label: "재직" },
  { value: "on_leave", label: "휴직" },
  { value: "left", label: "퇴사" },
];

function parsePhoneInput(value: string): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 11);
}

function toDateInputValue(d: string | null): string {
  if (!d) return "";
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
}

type Props = {
  mode: "new" | "edit";
  initialData?: StaffDetail | null;
  roleOptions: { id: number; name: string }[];
  canViewAdminMemo: boolean;
};

export function StaffRegistrationForm({ mode, initialData, roleOptions, canViewAdminMemo }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [name, setName] = useState(initialData?.name ?? "");
  const [loginId, setLoginId] = useState(initialData?.email ?? initialData?.login_id ?? "");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number | null>(initialData?.role_id ?? null);
  const [jobType, setJobType] = useState(initialData?.job_type ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(initialData?.contact_email ?? "");
  const [birthDate, setBirthDate] = useState(toDateInputValue(initialData?.birth_date ?? null));
  const [joinDate, setJoinDate] = useState(toDateInputValue(initialData?.join_date ?? null));
  const [leaveDate, setLeaveDate] = useState(toDateInputValue(initialData?.leave_date ?? null));
  const [employmentStatus, setEmploymentStatus] = useState(initialData?.employment_status ?? "employed");
  const [leaveReason, setLeaveReason] = useState(initialData?.leave_reason ?? "");
  const [profileImageUrl, setProfileImageUrl] = useState(initialData?.profile_image_url ?? "");
  const [adminMemo, setAdminMemo] = useState(initialData?.admin_memo ?? "");

  const isEdit = mode === "edit" && initialData;

  // 수정 모드: initialData가 바뀔 때(다른 직원으로 이동 등) 폼 값 동기화
  useEffect(() => {
    if (!initialData) return;
    setName(initialData.name ?? "");
    setLoginId(initialData.email ?? initialData.login_id ?? "");
    setRoleId(initialData.role_id ?? null);
    setJobType(initialData.job_type ?? "");
    setPhone(initialData.phone ?? "");
    setContactEmail(initialData.contact_email ?? "");
    setBirthDate(toDateInputValue(initialData.birth_date ?? null));
    setJoinDate(toDateInputValue(initialData.join_date ?? null));
    setLeaveDate(toDateInputValue(initialData.leave_date ?? null));
    setEmploymentStatus(initialData.employment_status ?? "employed");
    setLeaveReason(initialData.leave_reason ?? "");
    setProfileImageUrl(initialData.profile_image_url ?? "");
    setAdminMemo(initialData.admin_memo ?? "");
  }, [initialData?.id]);

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "staff-profile");
      const res = await fetch("/api/files/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success && json.url) {
        setProfileImageUrl(json.url);
      } else {
        alert(json.error || "업로드 실패");
      }
    } catch {
      alert("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        const result = await updateStaff(initialData.id, {
          name: name.trim(),
          role_id: roleId,
          job_type: jobType || null,
          phone: phone ? parsePhoneInput(phone) : null,
          contact_email: contactEmail.trim() || null,
          birth_date: birthDate || null,
          join_date: joinDate || null,
          leave_date: leaveDate || null,
          employment_status: employmentStatus,
          leave_reason: leaveReason.trim() || null,
          profile_image_url: profileImageUrl || null,
          admin_memo: canViewAdminMemo ? adminMemo.trim() || null : undefined,
        });
        if (result.success) {
          router.push("/staff");
          router.refresh();
        } else {
          alert(result.error || "저장에 실패했습니다.");
        }
      } else {
        const input: CreateStaffInput = {
          name: name.trim(),
          login_id: loginId.trim(),
          password,
          role_id: roleId,
          job_type: jobType || null,
          phone: phone ? parsePhoneInput(phone) : null,
          contact_email: contactEmail.trim() || null,
          birth_date: birthDate || null,
          join_date: joinDate || null,
          leave_date: leaveDate || null,
          employment_status: employmentStatus,
          leave_reason: leaveReason.trim() || null,
          profile_image_url: profileImageUrl || null,
          admin_memo: canViewAdminMemo ? adminMemo.trim() || null : null,
        };
        const result = await createStaff(input);
        if (result.success) {
          router.push("/staff");
          router.refresh();
        } else {
          alert(result.error || "등록에 실패했습니다.");
        }
      }
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 6) {
      alert("비밀번호는 6자 이상 입력해주세요.");
      return;
    }
    if (!initialData?.id) return;
    const result = await updateStaffPassword(initialData.id, newPassword);
    if (result.success) {
      setPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      alert("비밀번호가 변경되었습니다.");
    } else {
      alert(result.error || "비밀번호 변경에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm("해당 직원을 비활성화(퇴사) 처리하시겠습니까?")) return;
    const result = await deactivateStaff(initialData.id);
    if (result.success) {
      router.push("/staff");
      router.refresh();
    } else {
      alert(result.error || "처리에 실패했습니다.");
    }
  };

  return (
    <section className={`${styles.staffPage} page_section`}>
      <div className="page_title">
        <h1>{isEdit ? "직원 수정" : "직원 등록"}</h1>
        <div className="btn_wrap">
          {isEdit && (
            <button type="button" className="btn btn_lg normal" onClick={handleDelete} disabled={loading}>
              삭제
            </button>
          )}
          <button type="submit" form="staff-form" className="btn btn_lg primary" disabled={loading}>
            {loading ? (isEdit ? "저장 중..." : "등록 중...") : isEdit ? "저장" : "등록"}
          </button>
        </div>
      </div>
      <div className={styles.whiteBox}>
        <div className={styles.boxInner}>
          <form id="staff-form" onSubmit={handleSubmit} className={`table_group ${styles.root}`}>
            <div className="table_item">
              <h2 className="table_title">기본 정보</h2>
              <div className={styles.profileWrap}>
                <div className={styles.imgWrap}>
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="프로필" />
                  ) : (
                    <span className={styles.placeholder}>사진</span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.imgBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "..." : "📷"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenInput}
                  onChange={handleProfileUpload}
                />
              </div>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">이름</div>
                  <div className="table_data">
                    <input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">아이디</div>
                  <div className="table_data">
                    <input
                      type="text"
                      placeholder="아이디"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      required
                      disabled={!!isEdit}
                    />
                    {isEdit && <span className={styles.hint}>수정 불가</span>}
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">패스워드</div>
                  <div className="table_data">
                    {isEdit ? (
                      <>
                        <input type="password" placeholder="변경 시에만 입력" disabled className={styles.passwordInput} />
                        <button type="button" className="btn btn_sm normal" onClick={() => setPasswordModal(true)}>
                          변경
                        </button>
                      </>
                    ) : (
                      <input
                        type="password"
                        placeholder="6자 이상"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    )}
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">직급</div>
                  <div className="table_data">
                    <select value={roleId ?? ""} onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">선택</option>
                      {roleOptions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">담당 업무</div>
                  <div className="table_data">
                    <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                      <option value="">선택</option>
                      {JOB_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">휴대폰 번호</div>
                  <div className="table_data">
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="010-1234-5678"
                      value={formatPhoneDisplay(phone)}
                      onChange={(e) => setPhone(parsePhoneInput(e.target.value))}
                    />
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">이메일</div>
                  <div className="table_data">
                    <input
                      type="email"
                      placeholder="이메일"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">생년월일</div>
                  <div className="table_data">
                    <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">입사일</div>
                  <div className="table_data">
                    <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
                  </div>
                </li>
                <li className="row_group">
                  <div className="table_head">퇴사일</div>
                  <div className="table_data">
                    <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} />
                  </div>
                </li>
              </ul>
              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">재직 상태</div>
                  <div className="table_data">
                    {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                      <label key={opt.value} className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="employment_status"
                          value={opt.value}
                          checked={employmentStatus === opt.value}
                          onChange={() => setEmploymentStatus(opt.value)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </li>
                <li className="row_group">
                  <div className="table_head">퇴사 사유</div>
                  <div className="table_data">
                    <input
                      type="text"
                      placeholder="퇴사 사유"
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                    />
                  </div>
                </li>
              </ul>
            </div>
            {canViewAdminMemo && (
              <div className="table_item">
                <h2 className="table_title">관리자 메모</h2>
                <textarea
                  className={styles.adminMemo}
                  placeholder="관리자 메모"
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  rows={5}
                />
              </div>
            )}
          </form>
        </div>
      </div>

      {passwordModal && isEdit && (
        <div className={styles.modalOverlay} onClick={() => setPasswordModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>비밀번호 변경</h3>
            <input
              type="password"
              placeholder="새 비밀번호 (6자 이상)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button type="button" className="btn normal" onClick={() => setPasswordModal(false)}>
                취소
              </button>
              <button type="button" className="btn primary" onClick={handleChangePassword}>
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
