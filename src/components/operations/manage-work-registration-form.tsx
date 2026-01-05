"use client";

import { useState } from "react";
import Image from "next/image";
import { getManagedClientDetail } from "@/app/actions/managed-client";
import { ManagedClientSelectModal } from "./managed-client-select-modal";
import styles from "./manage-work-registration-form.module.css";

type ManagedClientData = {
  id: string;
  clientId: string;
  productType1: "deduct" | "maintenance";
  productType2: string;
  totalAmount: number | null;
  paymentStatus: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  detailTextEditCount: number;
  detailCodingEditCount: number;
  detailImageEditCount: number;
  detailPopupDesignCount: number;
  detailBannerDesignCount: number;
  note: string;
};

type ClientData = {
  id: string;
  businessRegistrationNumber: string;
  name: string;
  ceoName: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  businessType: string;
  businessItem: string;
  loginId: string;
  loginPassword: string;
  status: string;
  note: string;
  contacts: Array<{
    name: string;
    phone: string;
    email: string;
    title: string;
    note: string;
  }>;
  sites: Array<{
    brandName: string;
    domain: string;
    solution: string;
    loginId: string;
    loginPassword: string;
    type: string;
  }>;
  attachments: Array<{
    fileUrl: string;
    fileName: string;
    fileType: string;
  }>;
};

type ManageWorkRegistrationFormProps = {
  employeeName: string;
};

export function ManageWorkRegistrationForm({
  employeeName,
}: ManageWorkRegistrationFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isSitesOpen, setIsSitesOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isProductInfoOpen, setIsProductInfoOpen] = useState(true); // 기본적으로 열림
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [managedClientData, setManagedClientData] =
    useState<ManagedClientData | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);

  // 유지보수형 업무 등록용 상태
  const [workTasks, setWorkTasks] = useState<
    Array<{
      id: string;
      workType?: string; // 작업 유형: 'textEdit' | 'codingEdit' | 'imageEdit' | 'popupDesign' | 'bannerDesign'
      brandName: string;
      manager: string;
      workPeriod: string;
      attachment: File | null;
      workContent: string;
      count: number;
      status: "request" | "wait" | "approved" | "rejected";
    }>
  >([]);

  // 관리고객 선택 핸들러
  const handleSelectManagedClient = async (managedClientId: string) => {
    setIsLoading(true);
    setError("");
    const result = await getManagedClientDetail(managedClientId);
    if (result.success && result.managedClient && result.client) {
      setManagedClientData(result.managedClient);
      setClientData(result.client);
      setIsProductInfoOpen(true);
    } else {
      setError(result.error || "관리고객 정보를 불러오는데 실패했습니다.");
    }
    setIsLoading(false);
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  // 금액 포맷팅
  const formatAmount = (amount: number | null) => {
    if (amount === null) return "-";
    return amount.toLocaleString();
  };

  // 관리 상품 유형 표시
  const formatProductType2 = (
    type1: "deduct" | "maintenance",
    type2: string
  ) => {
    if (type1 === "deduct") {
      return type2.toUpperCase();
    } else {
      return type2 === "standard" ? "스탠다드" : "프리미엄";
    }
  };

  // 작업 유형 옵션 (유지보수형)
  const getWorkTypeOptions = () => {
    if (
      !managedClientData ||
      managedClientData.productType1 !== "maintenance"
    ) {
      return [];
    }

    const options: Array<{ value: string; label: string; remaining: number }> =
      [];

    if (managedClientData.detailTextEditCount > 0) {
      options.push({
        value: "textEdit",
        label: "영역 텍스트 수정",
        remaining: managedClientData.detailTextEditCount,
      });
    }
    if (managedClientData.detailCodingEditCount > 0) {
      options.push({
        value: "codingEdit",
        label: "코딩 수정",
        remaining: managedClientData.detailCodingEditCount,
      });
    }
    if (managedClientData.detailImageEditCount > 0) {
      options.push({
        value: "imageEdit",
        label: "기존 결과물 이미지 수정",
        remaining: managedClientData.detailImageEditCount,
      });
    }
    if (managedClientData.detailPopupDesignCount > 0) {
      options.push({
        value: "popupDesign",
        label: "팝업 디자인",
        remaining: managedClientData.detailPopupDesignCount,
      });
    }
    if (
      managedClientData.productType2 === "premium" &&
      managedClientData.detailBannerDesignCount > 0
    ) {
      options.push({
        value: "bannerDesign",
        label: "신규 배너 디자인",
        remaining: managedClientData.detailBannerDesignCount,
      });
    }

    return options;
  };

  // 업무 추가
  const handleAddWork = () => {
    const newTask = {
      id: Date.now().toString(),
      workType: "",
      brandName: "",
      manager: employeeName, // 로그인한 사용자 이름으로 초기화
      workPeriod: "",
      attachment: null,
      workContent: "",
      count: 1,
      status: "request" as const,
    };
    setWorkTasks([...workTasks, newTask]);
  };

  // 업무 삭제
  const handleRemoveWork = (id: string) => {
    setWorkTasks(workTasks.filter((task) => task.id !== id));
  };

  // 작업 유형 변경 핸들러
  const handleWorkTypeChange = (taskId: string, workType: string) => {
    setWorkTasks(
      workTasks.map((task) =>
        task.id === taskId ? { ...task, workType } : task
      )
    );
  };

  return (
    <section
      className={`manageWork_regist page_section ${styles.manageWorkRegist}`}
    >
      <div className="page_title">
        <h1>관리 업무 등록</h1>
        <div className="btn_wrap">
          <button type="button" className="btn btn_lg normal">
            삭제
          </button>
          <button
            type="submit"
            form="manageWorkForm"
            className="btn btn_lg primary"
          >
            등록
          </button>
        </div>
      </div>
      <form id="manageWorkForm">
        <div className="white_box">
          <div className={styles.importBtnWrapper}>
            <button
              type="button"
              className="import_btn btn btn_md black"
              onClick={() => setIsModalOpen(true)}
            >
              거래처 불러오기
            </button>
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
              }}
            >
              {error}
            </div>
          )}

          {isLoading && !managedClientData && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--text-gray)",
                fontSize: "14px",
              }}
            >
              관리고객 정보를 불러오는 중...
            </div>
          )}
          <div className="box_inner">
            <div className="table_group">
              {/* ERP 정보 */}
              <div className="table_item">
                <h2 className="table_title">ERP 정보</h2>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">아이디</div>
                    <div className="table_data">
                      {clientData?.loginId || "-"}
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">패스워드</div>
                    <div className="table_data">
                      {clientData?.loginPassword ? "••••••••" : "-"}
                    </div>
                  </li>
                </ul>
              </div>

              {/* 기본 정보 */}
              {clientData && (
                <div className="table_item">
                  <h2 className="table_title">기본 정보</h2>
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">거래처 사업자등록번호</div>
                      <div className="table_data">
                        {clientData.businessRegistrationNumber || "-"}
                      </div>
                    </li>
                  </ul>

                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">상호(법인명)</div>
                      <div className="table_data">{clientData.name || "-"}</div>
                    </li>
                    <li className="row_group">
                      <div className="table_head">대표자</div>
                      <div className="table_data">
                        {clientData.ceoName || "-"}
                      </div>
                    </li>
                  </ul>

                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">사업자 주소</div>
                      <div className="table_data">
                        {clientData.address && clientData.addressDetail
                          ? `${clientData.address} ${clientData.addressDetail}`.trim()
                          : clientData.address || "-"}
                      </div>
                    </li>
                  </ul>

                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">업태</div>
                      <div className="table_data">
                        {clientData.businessType || "-"}
                      </div>
                    </li>
                    <li className="row_group">
                      <div className="table_head">종목</div>
                      <div className="table_data">
                        {clientData.businessItem || "-"}
                      </div>
                    </li>
                  </ul>

                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">사업자 등록증 첨부</div>
                      <div className="table_data attach">
                        {clientData.attachments.find(
                          (a) => a.fileType === "business_registration"
                        )?.fileName || "-"}
                      </div>
                    </li>
                    <li className="row_group">
                      <div className="table_head">서명 등록</div>
                      <div className="table_data attach">
                        {clientData.attachments.find(
                          (a) => a.fileType === "signature"
                        )?.fileName || "-"}
                      </div>
                    </li>
                  </ul>

                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">휴·폐업 상태</div>
                      <div className="table_data">
                        {clientData.status || "-"}
                      </div>
                    </li>
                  </ul>
                </div>
              )}

              {/* 관리 상품 정보 */}
              {managedClientData && (
                <div className="table_item">
                  <h2
                    className={`table_title ${isProductInfoOpen ? "on" : ""}`}
                    onClick={() => setIsProductInfoOpen(!isProductInfoOpen)}
                    style={{ cursor: "pointer" }}
                  >
                    관리 상품 정보
                    <Image
                      src="/images/arrow_icon.svg"
                      alt=""
                      width={16}
                      height={16}
                      className={`${styles.tableToggle} ${
                        isProductInfoOpen ? styles.rotated : ""
                      }`}
                    />
                  </h2>
                  {isProductInfoOpen && (
                    <div className="table_wrap on">
                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">관리 상품 유형1</div>
                          <div className="table_data">
                            {managedClientData.productType1 === "deduct"
                              ? "금액차감형"
                              : "유지보수형"}
                          </div>
                        </li>
                      </ul>
                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">관리 상품 유형2</div>
                          <div className="table_data">
                            {formatProductType2(
                              managedClientData.productType1,
                              managedClientData.productType2
                            )}
                          </div>
                        </li>
                      </ul>
                      {managedClientData.productType1 === "deduct" ? (
                        <>
                          <ul className="table_row">
                            <li className="row_group">
                              <div className="table_head">총 금액</div>
                              <div className="table_data">
                                {formatAmount(managedClientData.totalAmount)}
                              </div>
                            </li>
                            <li className="row_group">
                              <div className="table_head">차감 금액</div>
                              <div className="table_data">-</div>
                            </li>
                            <li className="row_group">
                              <div className="table_head">잔여 금액</div>
                              <div className="table_data">
                                <span className="font_b">
                                  {formatAmount(managedClientData.totalAmount)}
                                </span>
                              </div>
                            </li>
                          </ul>
                        </>
                      ) : (
                        <ul className="table_row">
                          <li className="row_group">
                            <div className="table_head">세부 내용(잔여)</div>
                            <div
                              className="table_data pd12"
                              style={{ width: "50%" }}
                            >
                              <ul className="detail_list">
                                <li>
                                  영역 텍스트 수정
                                  <span>
                                    <b className="font_b">
                                      {managedClientData.detailTextEditCount}
                                    </b>
                                    회
                                  </span>
                                </li>
                                <li>
                                  코딩 수정
                                  <span>
                                    <b className="font_b">
                                      {managedClientData.detailCodingEditCount}
                                    </b>
                                    회
                                  </span>
                                </li>
                                <li>
                                  기존 결과물 이미지 수정
                                  <span>
                                    <b className="font_b">
                                      {managedClientData.detailImageEditCount}
                                    </b>
                                    회
                                  </span>
                                </li>
                                <li>
                                  팝업 디자인
                                  <span>
                                    <b className="font_b">
                                      {managedClientData.detailPopupDesignCount}
                                    </b>
                                    회
                                  </span>
                                </li>
                                {managedClientData.productType2 ===
                                  "premium" && (
                                  <li>
                                    신규 배너 디자인
                                    <span>
                                      <b className="font_b">
                                        {
                                          managedClientData.detailBannerDesignCount
                                        }
                                      </b>
                                      회
                                    </span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </li>
                        </ul>
                      )}
                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">시작일 ~ 종료일</div>
                          <div className="table_data">
                            {managedClientData.startDate &&
                            managedClientData.endDate
                              ? `${formatDate(
                                  managedClientData.startDate
                                )} ~ ${formatDate(managedClientData.endDate)}`
                              : "-"}
                          </div>
                        </li>
                        <li className="row_group">
                          <div className="table_head">진행상황</div>
                          <div className="table_data">
                            <span className="status_ongoing">진행</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 담당자 정보 */}
              {clientData && (
                <div className="table_item">
                  <h2 className="table_title">
                    담당자 정보
                    <button
                      type="button"
                      onClick={() => setIsContactsOpen(!isContactsOpen)}
                      className={styles.toggleBtn}
                    >
                      <Image
                        src="/images/arrow_icon.svg"
                        alt=""
                        width={16}
                        height={16}
                        className={`${styles.tableToggle} ${
                          isContactsOpen ? styles.rotated : ""
                        }`}
                      />
                    </button>
                  </h2>
                  {isContactsOpen && (
                    <div className="table_wrap">
                      {clientData.contacts && clientData.contacts.length > 0 ? (
                        clientData.contacts.map((contact, index) => (
                          <div key={index}>
                            <h3 className="table_title_sub">
                              담당자{index + 1}
                            </h3>
                            <ul className="table_row">
                              <li className="row_group">
                                <div className="table_head">이름</div>
                                <div className="table_data">
                                  {contact.name || "-"}
                                </div>
                              </li>
                              <li className="row_group">
                                <div className="table_head">연락처</div>
                                <div className="table_data">
                                  {contact.phone || "-"}
                                </div>
                              </li>
                            </ul>
                            <ul className="table_row">
                              <li className="row_group">
                                <div className="table_head">이메일</div>
                                <div className="table_data">
                                  {contact.email || "-"}
                                </div>
                              </li>
                              <li className="row_group">
                                <div className="table_head">비고</div>
                                <div className="table_data">
                                  {contact.note || "-"}
                                </div>
                              </li>
                            </ul>
                          </div>
                        ))
                      ) : (
                        <div
                          className="table_data"
                          style={{ padding: "18px 20px" }}
                        >
                          담당자 정보가 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 사이트 정보 */}
              {clientData && (
                <div className="table_item table_item2">
                  <h2 className="table_title">
                    사이트 정보
                    <button
                      type="button"
                      onClick={() => setIsSitesOpen(!isSitesOpen)}
                      className={styles.toggleBtn}
                    >
                      <Image
                        src="/images/arrow_icon.svg"
                        alt=""
                        width={16}
                        height={16}
                        className={`${styles.tableToggle} ${
                          isSitesOpen ? styles.rotated : ""
                        }`}
                      />
                    </button>
                  </h2>
                  {isSitesOpen && (
                    <div className="table_wrap">
                      {clientData.sites && clientData.sites.length > 0 ? (
                        <table className="site-table">
                          <colgroup>
                            <col style={{ width: "15%" }} />
                            <col style={{ width: "auto" }} />
                            <col style={{ width: "15%" }} />
                            <col style={{ width: "15%" }} />
                            <col style={{ width: "15%" }} />
                            <col style={{ width: "15%" }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th>브랜드</th>
                              <th>도메인</th>
                              <th>솔루션</th>
                              <th>아이디</th>
                              <th>패스워드</th>
                              <th>유형</th>
                            </tr>
                          </thead>
                          <tbody id="siteBody">
                            {clientData.sites.map((site, index) => (
                              <tr key={index} className="site-row">
                                <td data-th="브랜드">
                                  {site.brandName || "-"}
                                </td>
                                <td data-th="도메인">{site.domain || "-"}</td>
                                <td data-th="솔루션">{site.solution || "-"}</td>
                                <td data-th="아이디">{site.loginId || "-"}</td>
                                <td data-th="패스워드">
                                  {site.loginPassword ? "••••••••" : "-"}
                                </td>
                                <td data-th="유형">{site.type || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div
                          className="table_data"
                          style={{ padding: "18px 20px" }}
                        >
                          사이트 정보가 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 비고 */}
              {clientData && clientData.note && (
                <div className="table_item">
                  <h2 className="table_title">
                    비고
                    <button
                      type="button"
                      onClick={() => setIsNoteOpen(!isNoteOpen)}
                      className={styles.toggleBtn}
                    >
                      <Image
                        src="/images/arrow_icon.svg"
                        alt=""
                        width={16}
                        height={16}
                        className={`${styles.tableToggle} ${
                          isNoteOpen ? styles.rotated : ""
                        }`}
                      />
                    </button>
                  </h2>
                  {isNoteOpen && (
                    <div className="table_wrap">
                      <div className="text_box scroll">
                        <p>{clientData.note}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 업무 등록 */}
              {managedClientData && clientData && (
                <div
                  className={`table_item table_item2 ${styles.workRegistration}`}
                >
                  <h2 className="table_title">업무등록</h2>
                  <div className="table_wrap">
                    {/* 금액차감형 테이블 */}
                    {managedClientData.productType1 === "deduct" ? (
                      <table className={styles.workTable}>
                        <colgroup>
                          <col style={{ width: "10%" }} />
                          <col style={{ width: "8%" }} />
                          <col style={{ width: "15%" }} />
                          <col style={{ width: "10%" }} />
                          <col style={{ width: "12%" }} />
                          <col style={{ width: "18%" }} />
                          <col style={{ width: "27%" }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th>브랜드</th>
                            <th>담당자</th>
                            <th>작업기간</th>
                            <th>첨부파일</th>
                            <th>비용</th>
                            <th>작업내용</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody id="workBody">
                          <tr className={styles.workRow}>
                            <td data-th="브랜드">
                              <select>
                                <option value="">브랜드 선택</option>
                                {clientData.sites.map((site, index) => (
                                  <option key={index} value={site.brandName}>
                                    {site.brandName}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td data-th="담당자">
                              <input
                                type="text"
                                placeholder="담당자"
                                value={employeeName}
                                readOnly
                              />
                            </td>
                            <td data-th="작업기간">
                              <input
                                type="date"
                                className={styles.dateRange}
                                style={{ width: "100%" }}
                              />
                            </td>
                            <td data-th="첨부파일">
                              <div className="file-upload-box">
                                <input
                                  type="file"
                                  className="fileInput"
                                  hidden
                                />
                                <div className="file-upload-btn">
                                  첨부파일{" "}
                                  <Image
                                    src="/images/attach_icon.svg"
                                    alt=""
                                    width={12}
                                    height={12}
                                  />
                                </div>
                                <span className="fileName"></span>
                              </div>
                            </td>
                            <td data-th="비용">
                              <input type="text" placeholder="" />
                            </td>
                            <td data-th="작업내용">
                              <textarea
                                placeholder=""
                                className={styles.textArea}
                              ></textarea>
                            </td>
                            <td data-th="">
                              <span className={styles.approvalRequest}>
                                승인요청
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      /* 유지보수형 테이블 */
                      <>
                        <table className={styles.workTable}>
                          <colgroup>
                            <col style={{ width: "13%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "15%" }} />
                            <col style={{ width: "19%" }} />
                            <col style={{ width: "15%" }} />
                            <col style={{ width: "15%" }} />
                            <col style={{ width: "5%" }} />
                            <col style={{ width: "10%" }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th>브랜드</th>
                              <th>담당자</th>
                              <th>작업기간</th>
                              <th>작업유형</th>
                              <th>첨부파일</th>
                              <th>작업내용</th>
                              <th>횟수</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody id="workBodyMaintenance">
                            {workTasks.length === 0 ? (
                              <tr className={styles.workRow}>
                                <td
                                  colSpan={8}
                                  style={{
                                    textAlign: "center",
                                    padding: "20px",
                                  }}
                                >
                                  업무를 추가해주세요.
                                </td>
                              </tr>
                            ) : (
                              workTasks.map((task) => {
                                const workTypeOptions = getWorkTypeOptions();
                                const selectedOption = workTypeOptions.find(
                                  (opt: {
                                    value: string;
                                    label: string;
                                    remaining: number;
                                  }) => opt.value === task.workType
                                );

                                return (
                                  <tr key={task.id} className={styles.workRow}>
                                    <td data-th="브랜드">
                                      <select
                                        value={task.brandName}
                                        onChange={(e) =>
                                          setWorkTasks(
                                            workTasks.map((t) =>
                                              t.id === task.id
                                                ? {
                                                    ...t,
                                                    brandName: e.target.value,
                                                  }
                                                : t
                                            )
                                          )
                                        }
                                      >
                                        <option value="">브랜드 선택</option>
                                        {clientData?.sites.map(
                                          (site, index) => (
                                            <option
                                              key={index}
                                              value={site.brandName}
                                            >
                                              {site.brandName}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </td>
                                    <td data-th="담당자">
                                      <input
                                        type="text"
                                        placeholder="담당자"
                                        value={task.manager || employeeName}
                                        readOnly
                                      />
                                    </td>
                                    <td data-th="작업기간">
                                      <input
                                        type="date"
                                        className={styles.dateRange}
                                        value={task.workPeriod}
                                        onChange={(e) =>
                                          setWorkTasks(
                                            workTasks.map((t) =>
                                              t.id === task.id
                                                ? {
                                                    ...t,
                                                    workPeriod: e.target.value,
                                                  }
                                                : t
                                            )
                                          )
                                        }
                                        style={{ width: "100%" }}
                                      />
                                    </td>
                                    <td data-th="작업유형">
                                      <select
                                        value={task.workType || ""}
                                        onChange={(e) =>
                                          handleWorkTypeChange(
                                            task.id,
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value="">작업 유형 선택</option>
                                        {workTypeOptions.map(
                                          (option: {
                                            value: string;
                                            label: string;
                                            remaining: number;
                                          }) => (
                                            <option
                                              key={option.value}
                                              value={option.value}
                                              disabled={option.remaining <= 0}
                                            >
                                              {option.label} (잔여:{" "}
                                              {option.remaining}회)
                                            </option>
                                          )
                                        )}
                                      </select>
                                      {selectedOption && (
                                        <div
                                          style={{
                                            fontSize: "11px",
                                            color: "var(--text-gray)",
                                            marginTop: "4px",
                                          }}
                                        >
                                          잔여:{" "}
                                          <span className="font_b">
                                            {selectedOption.remaining}
                                          </span>
                                          회
                                        </div>
                                      )}
                                    </td>
                                    <td data-th="첨부파일">
                                      <div className="file-upload-box">
                                        <input
                                          type="file"
                                          className="fileInput"
                                          data-task-id={task.id}
                                          hidden
                                          onChange={(e) => {
                                            const file =
                                              e.target.files?.[0] || null;
                                            setWorkTasks(
                                              workTasks.map((t) =>
                                                t.id === task.id
                                                  ? { ...t, attachment: file }
                                                  : t
                                              )
                                            );
                                          }}
                                        />
                                        <div
                                          className="file-upload-btn"
                                          onClick={() => {
                                            const input =
                                              document.querySelector(
                                                `.fileInput[data-task-id="${task.id}"]`
                                              ) as HTMLInputElement;
                                            input?.click();
                                          }}
                                          style={{ cursor: "pointer" }}
                                        >
                                          첨부파일{" "}
                                          <Image
                                            src="/images/attach_icon.svg"
                                            alt=""
                                            width={12}
                                            height={12}
                                          />
                                        </div>
                                        <span className="fileName">
                                          {task.attachment?.name || ""}
                                        </span>
                                      </div>
                                    </td>
                                    <td data-th="작업내용">
                                      <textarea
                                        placeholder=""
                                        className={styles.textArea}
                                        value={task.workContent}
                                        onChange={(e) =>
                                          setWorkTasks(
                                            workTasks.map((t) =>
                                              t.id === task.id
                                                ? {
                                                    ...t,
                                                    workContent: e.target.value,
                                                  }
                                                : t
                                            )
                                          )
                                        }
                                      />
                                    </td>
                                    <td data-th="횟수">
                                      <input
                                        type="number"
                                        placeholder="1"
                                        value={task.count || 1}
                                        min={1}
                                        max={selectedOption?.remaining || 1}
                                        onChange={(e) =>
                                          setWorkTasks(
                                            workTasks.map((t) =>
                                              t.id === task.id
                                                ? {
                                                    ...t,
                                                    count:
                                                      parseInt(
                                                        e.target.value
                                                      ) || 1,
                                                  }
                                                : t
                                            )
                                          )
                                        }
                                      />
                                    </td>
                                    <td data-th="">
                                      <div
                                        style={{
                                          display: "flex",
                                          gap: "4px",
                                          flexDirection: "column",
                                        }}
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveWork(task.id)
                                          }
                                          style={{
                                            padding: "4px 8px",
                                            fontSize: "12px",
                                            background: "var(--negative)",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          삭제
                                        </button>
                                        <span
                                          className={
                                            task.status === "wait"
                                              ? styles.approvalWait
                                              : styles.approvalRequest
                                          }
                                          style={{ cursor: "pointer" }}
                                          onClick={() => {
                                            if (!task.workType) {
                                              alert(
                                                "작업 유형을 선택해주세요."
                                              );
                                              return;
                                            }
                                            if (!task.brandName) {
                                              alert("브랜드를 선택해주세요.");
                                              return;
                                            }

                                            // 승인 요청 처리
                                            const selectedOption =
                                              workTypeOptions.find(
                                                (opt) =>
                                                  opt.value === task.workType
                                              );

                                            if (
                                              !selectedOption ||
                                              selectedOption.remaining <
                                                task.count
                                            ) {
                                              alert("남은 횟수가 부족합니다.");
                                              return;
                                            }

                                            // 상태 변경
                                            setWorkTasks(
                                              workTasks.map((t) =>
                                                t.id === task.id
                                                  ? { ...t, status: "wait" }
                                                  : t
                                              )
                                            );

                                            // 남은 횟수 차감 (관리 상품 정보 업데이트)
                                            if (managedClientData) {
                                              const updatedData = {
                                                ...managedClientData,
                                              };

                                              switch (task.workType) {
                                                case "textEdit":
                                                  updatedData.detailTextEditCount =
                                                    Math.max(
                                                      0,
                                                      updatedData.detailTextEditCount -
                                                        task.count
                                                    );
                                                  break;
                                                case "codingEdit":
                                                  updatedData.detailCodingEditCount =
                                                    Math.max(
                                                      0,
                                                      updatedData.detailCodingEditCount -
                                                        task.count
                                                    );
                                                  break;
                                                case "imageEdit":
                                                  updatedData.detailImageEditCount =
                                                    Math.max(
                                                      0,
                                                      updatedData.detailImageEditCount -
                                                        task.count
                                                    );
                                                  break;
                                                case "popupDesign":
                                                  updatedData.detailPopupDesignCount =
                                                    Math.max(
                                                      0,
                                                      updatedData.detailPopupDesignCount -
                                                        task.count
                                                    );
                                                  break;
                                                case "bannerDesign":
                                                  updatedData.detailBannerDesignCount =
                                                    Math.max(
                                                      0,
                                                      updatedData.detailBannerDesignCount -
                                                        task.count
                                                    );
                                                  break;
                                              }

                                              setManagedClientData(updatedData);
                                            }

                                            alert(
                                              "승인 요청이 완료되었습니다."
                                            );
                                            // TODO: 실제 DB 저장 로직 추가 필요
                                          }}
                                        >
                                          {task.status === "wait"
                                            ? "승인대기"
                                            : "승인요청"}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                        <div style={{ marginTop: "10px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={handleAddWork}
                            className="btn btn_md normal"
                          >
                            + 업무 추가
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      <ManagedClientSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectManagedClient}
      />
    </section>
  );
}
