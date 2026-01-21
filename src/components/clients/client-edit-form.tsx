"use client";

import { Plus, X, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  updateClient,
  checkBusinessRegistrationNumber,
} from "@/app/actions/client";
import AddressSearch from "@/components/common/address-search";
import { formatBusinessNumberInput } from "@/lib/business-number";
import styles from "./client-form.module.css";

type ClientDetail = {
  id: string;
  loginId?: string;
  loginPassword?: string;
  businessRegistrationNumber: string;
  name: string;
  postalCode?: string;
  address?: string;
  addressDetail?: string;
  ceoName?: string;
  businessType?: string;
  businessItem?: string;
  businessRegistrationFile?: string;
  businessRegistrationFileUrl?: string;
  signatureFile?: string;
  signatureFileUrl?: string;
  status: "정상" | "휴업" | "폐업";
  contacts: Array<{
    name: string;
    phone?: string;
    email?: string;
    note?: string;
  }>;
  sites: Array<{
    brandName?: string;
    solution?: string;
    domain?: string;
    loginId?: string;
    loginPassword?: string;
    type?: string;
  }>;
  note?: string;
};

type ClientEditFormProps = {
  client: ClientDetail;
  clientId: string;
};

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  title: string;
  note: string;
};

type Site = {
  id: string;
  brandName: string;
  domain: string;
  solution: string;
  loginId: string;
  loginPassword: string;
  type: string;
  note: string;
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function ClientEditForm({ client, clientId }: ClientEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [passwordChangeMode, setPasswordChangeMode] = useState(false);
  const businessRegistrationFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [attachments, setAttachments] = useState<
    Array<{
      fileUrl: string;
      fileName: string;
      fileType: "business_registration" | "signature";
    }>
  >([]);
  // 선택한 파일을 임시로 저장 (아직 업로드 안 함)
  const [pendingFiles, setPendingFiles] = useState<
    Array<{ file: File; fileType: "business_registration" | "signature" }>
  >([]);
  // 사업자 상태 (API에서 가져온 정보)
  const [businessStatus, setBusinessStatus] = useState<
    "정상" | "휴업" | "폐업" | null
  >(null);

  const handleBusinessNumberInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.target.value = formatBusinessNumberInput(event.target.value);
  };

  // 초기 데이터 설정
  useEffect(() => {
    if (client) {
      // 담당자 정보 초기화
      const initialContacts =
        client.contacts.length > 0
          ? client.contacts.map((c) => ({
              id: createId(),
              name: c.name || "",
              phone: c.phone || "",
              email: c.email || "",
              title: "",
              note: c.note || "",
            }))
          : [
              {
                id: createId(),
                name: "",
                phone: "",
                email: "",
                title: "",
                note: "",
              },
            ];
      setContacts(initialContacts);

      // 사이트 정보 초기화
      const initialSites =
        client.sites.length > 0
          ? client.sites.map((s) => ({
              id: createId(),
              brandName: s.brandName || "",
              domain: s.domain || "",
              solution: s.solution || "",
              loginId: s.loginId || "",
              loginPassword: s.loginPassword || "",
              type: s.type || "",
              note: "",
            }))
          : [
              {
                id: createId(),
                brandName: "",
                domain: "",
                solution: "",
                loginId: "",
                loginPassword: "",
                type: "",
                note: "",
              },
            ];
      setSites(initialSites);

      // 첨부파일 초기화
      const initialAttachments: Array<{
        fileUrl: string;
        fileName: string;
        fileType: "business_registration" | "signature";
      }> = [];
      if (client.businessRegistrationFile) {
        initialAttachments.push({
          fileUrl: client.businessRegistrationFileUrl || "",
          fileName: client.businessRegistrationFile,
          fileType: "business_registration",
        });
      }
      if (client.signatureFile) {
        initialAttachments.push({
          fileUrl: client.signatureFileUrl || "",
          fileName: client.signatureFile,
          fileType: "signature",
        });
      }
      setAttachments(initialAttachments);
    }
  }, [client]);

  const addContact = () =>
    setContacts((prev) => [
      ...prev,
      { id: createId(), name: "", phone: "", email: "", title: "", note: "" },
    ]);
  const removeContact = (id: string) =>
    setContacts((prev) => prev.filter((contact) => contact.id !== id));

  const addSite = () =>
    setSites((prev) => [
      ...prev,
      {
        id: createId(),
        brandName: "",
        domain: "",
        solution: "",
        loginId: "",
        loginPassword: "",
        type: "",
        note: "",
      },
    ]);
  const removeSite = (id: string) =>
    setSites((prev) => prev.filter((site) => site.id !== id));

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // 중복확인
  const handleCheckDuplicate = async () => {
    const input = document.querySelector(
      'input[name="businessRegistrationNumber"]'
    ) as HTMLInputElement;
    const businessNumber = input?.value.trim();

    if (!businessNumber) {
      alert("사업자등록번호를 입력해주세요.");
      return;
    }

    setCheckingDuplicate(true);
    setDuplicateCheckResult("");

    const result = await checkBusinessRegistrationNumber(
      businessNumber,
      clientId
    );

    setCheckingDuplicate(false);

    if (result.success && !result.isDuplicate) {
      let message = "사용 가능한 사업자등록번호입니다.";
      if ("businessStatus" in result && result.businessStatus) {
        // 상태 자동 반영
        const statusMap: Record<string, "정상" | "휴업" | "폐업"> = {
          approved: "정상",
          suspended: "휴업",
          closed: "폐업",
        };
        const newStatus = statusMap[result.businessStatus.status] || "정상";
        setBusinessStatus(newStatus);

        // 라디오 버튼 자동 선택
        const statusRadio = document.querySelector(
          `input[name="status"][value="${newStatus}"]`
        ) as HTMLInputElement;
        if (statusRadio) {
          statusRadio.checked = true;
        }
      }
      setDuplicateCheckResult(message);
      alert(message);
    } else {
      // 에러 발생 시 상태를 원래 값으로 초기화 (수정 폼이므로 기존 값 유지)
      setBusinessStatus(null);

      // 라디오 버튼을 원래 값으로 복원
      const originalStatus =
        client.status === "정상"
          ? "정상"
          : client.status === "휴업"
          ? "휴업"
          : client.status === "폐업"
          ? "폐업"
          : "정상";
      const statusRadio = document.querySelector(
        `input[name="status"][value="${originalStatus}"]`
      ) as HTMLInputElement;
      if (statusRadio) {
        statusRadio.checked = true;
      }

      // 에러 메시지 우선 표시 (error 필드가 있으면 사용)
      const errorMessage =
        ("error" in result ? result.error : undefined) ||
        ("message" in result ? result.message : undefined) ||
        "이미 등록된 사업자등록번호이거나 확인할 수 없습니다.";
      setDuplicateCheckResult(errorMessage);
      alert(errorMessage);
    }
  };

  // 파일 선택 시 state에 저장 (아직 업로드 안 함)
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "business_registration" | "signature"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (30MB)
      if (file.size > 30 * 1024 * 1024) {
        alert("파일 크기는 30MB 이하여야 합니다.");
        return;
      }

      // 같은 타입의 기존 파일 제거하고 새 파일 추가
      setPendingFiles((prev) => [
        ...prev.filter((f) => f.fileType !== fileType),
        { file, fileType },
      ]);

      // input 초기화 (같은 파일을 다시 선택할 수 있도록)
      e.target.value = "";
    }
  };

  // 파일 업로드 (저장/수정 버튼 클릭 시 호출)
  const uploadPendingFiles = async (): Promise<
    Array<{
      fileUrl: string;
      fileName: string;
      fileType: "business_registration" | "signature";
    }>
  > => {
    if (pendingFiles.length === 0) return [];

    setUploading(true);
    const uploadedFiles: Array<{
      fileUrl: string;
      fileName: string;
      fileType: "business_registration" | "signature";
    }> = [];

    try {
      for (const { file, fileType } of pendingFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "folder",
          fileType === "business_registration"
            ? "business-registration"
            : "signature"
        );

        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: `HTTP ${response.status}: ${response.statusText}`,
          }));
          throw new Error(errorData.error || `서버 오류 (${response.status})`);
        }

        const result = await response.json();

        if (result.success) {
          uploadedFiles.push({
            fileUrl: result.url,
            fileName: result.fileName,
            fileType,
          });
        } else {
          throw new Error(result.error || "파일 업로드 실패");
        }
      }

      return uploadedFiles;
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      throw new Error(`파일 업로드 실패: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. 선택한 파일들 먼저 업로드
      const uploadedFiles = await uploadPendingFiles();

      // 2. 업로드된 파일들을 attachments에 추가 (기존 파일과 병합)
      const allAttachments = [
        ...attachments.filter(
          (a) => !pendingFiles.some((pf) => pf.fileType === a.fileType)
        ), // 기존 파일 중 pendingFiles와 타입이 다른 것만 유지
        ...uploadedFiles,
      ];

      // form element 직접 가져오기
      const formElement = document.getElementById(
        "clientEditForm"
      ) as HTMLFormElement;
      if (!formElement) {
        throw new Error("Form element not found");
      }
      const formData = new FormData(formElement);

      // 기본 정보 수집
      const clientData = {
        businessRegistrationNumber: formData.get(
          "businessRegistrationNumber"
        ) as string,
        name: formData.get("name") as string,
        ceoName: formData.get("ceoName") as string,
        postalCode: formData.get("postalCode") as string,
        address: formData.get("address") as string,
        addressDetail: formData.get("addressDetail") as string,
        businessType: formData.get("businessType") as string,
        businessItem: formData.get("businessItem") as string,
        loginId: formData.get("loginId") as string,
        loginPassword: passwordChangeMode
          ? (formData.get("loginPassword") as string)
          : "", // 비밀번호 변경 모드일 때만
        note: formData.get("note") as string,
        status: formData.get("status") as string, // 휴·폐업 상태
      };

      // 담당자 정보 수집
      const contactsData = contacts.map((contact) => ({
        name: formData.get(`contact_${contact.id}_name`) as string,
        phone: formData.get(`contact_${contact.id}_phone`) as string,
        email: formData.get(`contact_${contact.id}_email`) as string,
        title: formData.get(`contact_${contact.id}_title`) as string,
        note: formData.get(`contact_${contact.id}_note`) as string,
      }));

      // 사이트 정보 수집
      const sitesData = sites.map((site) => ({
        brandName: formData.get(`site_${site.id}_brandName`) as string,
        domain: formData.get(`site_${site.id}_domain`) as string,
        solution: formData.get(`site_${site.id}_solution`) as string,
        loginId: formData.get(`site_${site.id}_loginId`) as string,
        loginPassword: formData.get(`site_${site.id}_loginPassword`) as string,
        type: formData.get(`site_${site.id}_type`) as string,
        note: formData.get(`site_${site.id}_note`) as string,
      }));

      // Server Action 호출
      const result = await updateClient(clientId, {
        ...clientData,
        contacts: contactsData,
        sites: sitesData,
        attachments: allAttachments,
      });

      if (result.success) {
        alert("거래처가 수정되었습니다.");
        router.push("/clients");
      } else {
        alert("수정 실패: " + result.error);
      }
    } catch (error) {
      console.error("수정 오류:", error);
      alert(
        error instanceof Error ? error.message : "수정 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (confirm("정말 이 거래처를 삭제하시겠습니까?")) {
      // TODO: 삭제 로직 구현
      alert("삭제 기능은 구현 예정입니다.");
    }
  };

  return (
    <section className={`${styles.clientRegist} page_section`}>
      <div className="page_title">
        <h1>거래처 수정</h1>
        <div className="btn_wrap">
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn_lg normal"
          >
            삭제
          </button>
          <button
            type="submit"
            form="clientEditForm"
            disabled={loading || uploading}
            className="btn btn_lg primary disabled:opacity-50"
          >
            {loading || uploading
              ? uploading
                ? "파일 업로드 중..."
                : "수정 중..."
              : "수정"}
          </button>
        </div>
      </div>
      <form id="clientEditForm" onSubmit={handleSubmit}>
        <div className="white_box">
          <div className={styles.boxInner}>
            <div className="table_group">
              {/* ERP 정보 */}
              <div className="table_item">
                <h2 className="table_title">ERP 정보</h2>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">아이디</div>
                    <div className="table_data pd12">
                      <input
                        name="loginId"
                        type="text"
                        defaultValue={client.loginId || ""}
                        readOnly
                      />
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">패스워드</div>
                    <div className="table_data pd12">
                      <div className="flex gap-2 items-center">
                        <input
                          name="loginPassword"
                          type="password"
                          placeholder={
                            passwordChangeMode ? "새 비밀번호 입력" : "••••••••"
                          }
                          readOnly={!passwordChangeMode}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPasswordChangeMode(!passwordChangeMode)
                          }
                          className="btn btn_md normal"
                        >
                          {passwordChangeMode ? "취소" : "변경"}
                        </button>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              {/* 기본 정보 */}
              <div className="table_item">
                <h2 className="table_title">기본 정보</h2>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">거래처 사업자등록번호</div>
                    <div className="table_data pd12">
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          name="businessRegistrationNumber"
                          type="text"
                          defaultValue={client.businessRegistrationNumber}
                          required
                          style={{ flex: 1 }}
                          placeholder="123-45-67890"
                          inputMode="numeric"
                          onChange={handleBusinessNumberInput}
                        />
                        <button
                          type="button"
                          onClick={handleCheckDuplicate}
                          disabled={checkingDuplicate}
                          className="btn btn_md normal"
                        >
                          {checkingDuplicate ? "확인 중..." : "중복확인"}
                        </button>
                        {duplicateCheckResult && (
                          <span
                            style={{
                              fontSize: "12px",
                              whiteSpace: "nowrap",
                              color: duplicateCheckResult.includes("사용 가능")
                                ? "#10b981"
                                : "#ef4444",
                            }}
                          >
                            {duplicateCheckResult}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">상호(법인명)</div>
                    <div className="table_data pd12">
                      <input
                        name="name"
                        type="text"
                        defaultValue={client.name}
                        required
                        placeholder="상호(법인명)"
                      />
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">대표자</div>
                    <div className="table_data pd12">
                      <input
                        name="ceoName"
                        type="text"
                        defaultValue={client.ceoName || ""}
                        placeholder="대표자명"
                      />
                    </div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">사업자 주소</div>
                    <div className="table_data pd12">
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          name="address"
                          type="text"
                          defaultValue={client.address || ""}
                          readOnly
                          style={{ flex: 1, opacity: 0.75 }}
                          placeholder="사업자 주소"
                        />
                        <AddressSearch
                          onComplete={(data) => {
                            const addressInput = document.querySelector(
                              'input[name="address"]'
                            ) as HTMLInputElement;
                            const postalCodeInput = document.querySelector(
                              'input[name="postalCode"]'
                            ) as HTMLInputElement;
                            if (addressInput) {
                              addressInput.value =
                                data.address +
                                (data.buildingName
                                  ? ` ${data.buildingName}`
                                  : "");
                              addressInput.dispatchEvent(
                                new Event("input", { bubbles: true })
                              );
                            }
                            if (postalCodeInput) {
                              postalCodeInput.value = data.zonecode;
                              postalCodeInput.dispatchEvent(
                                new Event("input", { bubbles: true })
                              );
                            }
                          }}
                        >
                          <button type="button" className="btn btn_md normal">
                            주소검색
                          </button>
                        </AddressSearch>
                      </div>
                    </div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">우편번호</div>
                    <div className="table_data pd12">
                      <input
                        name="postalCode"
                        type="text"
                        readOnly
                        defaultValue={client.postalCode || ""}
                        style={{ opacity: 0.75 }}
                        placeholder="우편번호"
                      />
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">상세 주소</div>
                    <div className="table_data pd12">
                      <input
                        name="addressDetail"
                        type="text"
                        defaultValue={client.addressDetail || ""}
                        placeholder="상세 주소"
                      />
                    </div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">업태</div>
                    <div className="table_data pd12">
                      <input
                        name="businessType"
                        type="text"
                        defaultValue={client.businessType || ""}
                        placeholder="업태명"
                      />
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">종목</div>
                    <div className="table_data pd12">
                      <input
                        name="businessItem"
                        type="text"
                        defaultValue={client.businessItem || ""}
                        placeholder="종목명"
                      />
                    </div>
                  </li>
                </ul>
                <ul className={`table_row ${styles.lastRow}`}>
                  <li className="row_group">
                    <div className="table_head">사업자 등록증 첨부</div>
                    <div className="table_data pd12">
                      <div className="space-y-2">
                        {attachments
                          .filter((a) => a.fileType === "business_registration")
                          .map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span>{attachment.fileName}</span>
                              {attachment.fileUrl && (
                                <a
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  보기
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  removeAttachment(
                                    attachments.findIndex(
                                      (a) => a === attachment
                                    )
                                  )
                                }
                                className="text-red-500 hover:text-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        {pendingFiles
                          .filter((f) => f.fileType === "business_registration")
                          .map((pendingFile, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm text-blue-600"
                            >
                              <span>
                                {pendingFile.file.name} (업로드 대기 중)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingFiles((prev) =>
                                    prev.filter(
                                      (f, i) =>
                                        !(
                                          f.fileType ===
                                            "business_registration" &&
                                          i === index
                                        )
                                    )
                                  );
                                }}
                                className="text-red-500 hover:text-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        <button
                          type="button"
                          onClick={() =>
                            businessRegistrationFileInputRef.current?.click()
                          }
                          disabled={uploading || loading}
                          className="btn btn_md normal"
                        >
                          <Upload size={14} className="inline mr-1" />
                          파일 선택
                        </button>
                        <input
                          ref={businessRegistrationFileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) =>
                            handleFileSelect(e, "business_registration")
                          }
                          disabled={uploading || loading}
                        />
                      </div>
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">서명 등록</div>
                    <div className="table_data pd12">
                      <div className="space-y-2">
                        {attachments
                          .filter((a) => a.fileType === "signature")
                          .map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span>{attachment.fileName}</span>
                              {attachment.fileUrl && (
                                <a
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  보기
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  removeAttachment(
                                    attachments.findIndex(
                                      (a) => a === attachment
                                    )
                                  )
                                }
                                className="text-red-500 hover:text-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        {pendingFiles
                          .filter((f) => f.fileType === "signature")
                          .map((pendingFile, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm text-blue-600"
                            >
                              <span>
                                {pendingFile.file.name} (업로드 대기 중)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingFiles((prev) =>
                                    prev.filter(
                                      (f, i) =>
                                        !(
                                          f.fileType === "signature" &&
                                          i === index
                                        )
                                    )
                                  );
                                }}
                                className="text-red-500 hover:text-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        <button
                          type="button"
                          onClick={() => signatureFileInputRef.current?.click()}
                          disabled={uploading || loading}
                          className="btn btn_md normal"
                        >
                          <Upload size={14} className="inline mr-1" />
                          파일 선택
                        </button>
                        <input
                          ref={signatureFileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, "signature")}
                          disabled={uploading || loading}
                        />
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              {/* 담당자 정보 */}
              <div className="table_item">
                <div className="flex items-center justify-between mb-8">
                  <h2 className={`table_title ${styles.contactTitle}`}>
                    담당자 정보
                  </h2>
                  <button
                    type="button"
                    onClick={addContact}
                    className="btn btn_md normal"
                  >
                    <Plus size={16} className="inline mr-1" />
                    담당자 추가
                  </button>
                </div>
                {contacts.map((contact, index) => (
                  <div
                    key={contact.id}
                    style={{ marginTop: index > 0 ? "30px" : "0" }}
                  >
                    <div
                      className={styles.contactHeader}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <h3 className="table_title_sub">담당자{index + 1}</h3>
                      {contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContact(contact.id)}
                          style={{
                            color: "#ef4444",
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                            fontSize: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0",
                          }}
                          title="삭제"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">이름</div>
                        <div className="table_data pd12">
                          <input
                            name={`contact_${contact.id}_name`}
                            type="text"
                            defaultValue={contact.name}
                            required
                            placeholder="이름"
                          />
                        </div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">연락처</div>
                        <div className="table_data pd12">
                          <input
                            name={`contact_${contact.id}_phone`}
                            type="text"
                            defaultValue={contact.phone}
                            placeholder="010-1234-5678"
                          />
                        </div>
                      </li>
                    </ul>
                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">이메일</div>
                        <div className="table_data pd12">
                          <input
                            name={`contact_${contact.id}_email`}
                            type="email"
                            defaultValue={contact.email}
                            placeholder="이메일"
                          />
                        </div>
                      </li>
                      <li className="row_group">
                        <div className="table_head">비고</div>
                        <div className="table_data pd12">
                          <input
                            name={`contact_${contact.id}_note`}
                            type="text"
                            defaultValue={contact.note}
                            placeholder="특이사항"
                          />
                        </div>
                      </li>
                    </ul>
                  </div>
                ))}
              </div>

              {/* 사이트 정보 */}
              <div className="table_item table_item2">
                <h2 className="table_title">
                  사이트 정보
                  <span
                    className="plus_btn"
                    onClick={addSite}
                    style={{ marginLeft: "10px", cursor: "pointer" }}
                  >
                    + 사이트 추가
                  </span>
                </h2>
                <div className="table_wrap">
                  <table className={styles.siteTable}>
                    <colgroup>
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "auto" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "5%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>브랜드</th>
                        <th>도메인</th>
                        <th>솔루션</th>
                        <th>아이디</th>
                        <th>패스워드</th>
                        <th>유형</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((site, index) => (
                        <tr key={site.id} className="site-row">
                          <td data-th="브랜드">
                            <input
                              name={`site_${site.id}_brandName`}
                              type="text"
                              defaultValue={site.brandName}
                              placeholder="브랜드명"
                            />
                          </td>
                          <td data-th="도메인">
                            <input
                              name={`site_${site.id}_domain`}
                              type="text"
                              defaultValue={site.domain}
                              placeholder="https://example.com"
                            />
                          </td>
                          <td data-th="솔루션">
                            <select
                              name={`site_${site.id}_solution`}
                              defaultValue={site.solution || ""}
                            >
                              <option value="">선택</option>
                              <option value="카페24">카페24</option>
                              <option value="고도몰">고도몰</option>
                              <option value="메이크샵">메이크샵</option>
                              <option value="기타">기타</option>
                            </select>
                          </td>
                          <td data-th="아이디">
                            <input
                              name={`site_${site.id}_loginId`}
                              type="text"
                              defaultValue={site.loginId}
                              placeholder="아이디"
                            />
                          </td>
                          <td data-th="패스워드">
                            <input
                              name={`site_${site.id}_loginPassword`}
                              type="text"
                              defaultValue={site.loginPassword}
                              placeholder="패스워드"
                            />
                          </td>
                          <td data-th="유형">
                            <select
                              name={`site_${site.id}_type`}
                              defaultValue={site.type || ""}
                            >
                              <option value="">선택</option>
                              <option value="신규">신규</option>
                              <option value="리뉴얼">리뉴얼</option>
                              <option value="이전">이전</option>
                              <option value="개발">개발</option>
                              <option value="유지보수">유지보수</option>
                              <option value="기타">기타</option>
                            </select>
                          </td>
                          <td className="right">
                            {sites.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSite(site.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  padding: "0",
                                }}
                                title="삭제"
                              >
                                <X size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 비고 */}
              <div className="table_item">
                <h2 className="table_title">비고</h2>
                <div className="table_wrap">
                  <textarea
                    name="note"
                    defaultValue={client.note || ""}
                    placeholder="추가 정보를 입력하세요"
                    style={{
                      width: "100%",
                      border: "none",
                      resize: "none",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}

type FieldProps = {
  name?: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  defaultValue?: string;
};

function Field({
  name,
  label,
  required,
  type = "text",
  placeholder,
  className,
  readOnly,
  defaultValue,
}: FieldProps) {
  return (
    <label className={`block text-sm ${className || ""}`}>
      <span className="font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-slate-100 disabled:cursor-not-allowed"
      />
    </label>
  );
}
