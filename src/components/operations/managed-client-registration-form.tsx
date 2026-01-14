"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import {
  getClientForManagedRegistration,
  createManagedClient,
} from "@/app/actions/managed-client";
import { ClientSelectModal } from "./client-select-modal";
import styles from "./managed-client-registration-form.module.css";

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

export function ManagedClientRegistrationForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 토글 상태 (기본값: 닫힘)
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isSitesOpen, setIsSitesOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // 관리 상품 정보 상태
  const [productType1, setProductType1] = useState<"deduct" | "maintenance">(
    "deduct"
  );
  const [productType2, setProductType2] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "paid" | "prepaid" | "unpaid"
  >("unpaid");
  const [detailTextEditCount, setDetailTextEditCount] = useState("");
  const [detailCodingEditCount, setDetailCodingEditCount] = useState("");
  const [detailImageEditCount, setDetailImageEditCount] = useState("");
  const [detailPopupDesignCount, setDetailPopupDesignCount] = useState("");
  const [detailBannerDesignCount, setDetailBannerDesignCount] = useState("");

  // 기본값 정의
  const getDefaultValue = (field: string) => {
    if (productType2 === "standard") {
      const defaults: Record<string, string> = {
        textEdit: "3",
        codingEdit: "3",
        imageEdit: "2",
        popupDesign: "1",
        bannerDesign: "",
      };
      return defaults[field] || "";
    } else if (productType2 === "premium") {
      const defaults: Record<string, string> = {
        textEdit: "5",
        codingEdit: "5",
        imageEdit: "5",
        popupDesign: "3",
        bannerDesign: "2",
      };
      return defaults[field] || "";
    }
    return "";
  };

  // 기본값과 다른지 확인
  const isChanged = (field: string, value: string) => {
    if (!productType2) return false;
    const defaultValue = getDefaultValue(field);
    return value !== "" && value !== defaultValue;
  };

  const handleSelectClient = async (clientId: string) => {
    setIsLoading(true);
    setError("");
    const result = await getClientForManagedRegistration(clientId);
    if (result.success && result.client) {
      setClientData(result.client);
    } else {
      setError(result.error || "거래처 정보를 불러오는데 실패했습니다.");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientData) {
      setError("거래처를 선택해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    const data = {
      clientId: clientData.id,
      productType1,
      productType2: productType2 || undefined,
      totalAmount:
        productType1 === "deduct" && totalAmount
          ? parseFloat(totalAmount)
          : undefined,
      paymentStatus,
      detailTextEditCount:
        productType1 === "maintenance" && detailTextEditCount
          ? parseInt(detailTextEditCount)
          : undefined,
      detailCodingEditCount:
        productType1 === "maintenance" && detailCodingEditCount
          ? parseInt(detailCodingEditCount)
          : undefined,
      detailImageEditCount:
        productType1 === "maintenance" && detailImageEditCount
          ? parseInt(detailImageEditCount)
          : undefined,
      detailPopupDesignCount:
        productType1 === "maintenance" && detailPopupDesignCount
          ? parseInt(detailPopupDesignCount)
          : undefined,
      detailBannerDesignCount:
        productType1 === "maintenance" &&
        productType2 === "premium" &&
        detailBannerDesignCount
          ? parseInt(detailBannerDesignCount)
          : undefined,
    };

    const result = await createManagedClient(data);
    if (result.success) {
      alert("관리고객이 등록되었습니다.");
      // 폼 초기화
      setClientData(null);
      setProductType1("deduct");
      setProductType2("");
      setTotalAmount("");
      setPaymentStatus("unpaid");
      setDetailTextEditCount("");
      setDetailCodingEditCount("");
      setDetailImageEditCount("");
      setDetailPopupDesignCount("");
      setDetailBannerDesignCount("");
    } else {
      setError(result.error || "관리고객 등록에 실패했습니다.");
    }
    setIsLoading(false);
  };

  const businessRegistrationFile = clientData?.attachments.find(
    (a) => a.fileType === "business_registration"
  );
  const signatureFile = clientData?.attachments.find(
    (a) => a.fileType === "signature"
  );

  return (
    <section className={`manageClient_regist page_section ${styles.manageClientRegist}`}>
      <div className="page_title">
        <h1>관리 고객 등록</h1>
        <div className="btn_wrap">
          <button
            type="submit"
            form="manageClientForm"
            disabled={isLoading || !clientData}
            className="btn btn_lg primary"
          >
            {isLoading ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>

      <form id="manageClientForm" onSubmit={handleSubmit}>
        <div className="white_box">
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "30px",
            }}
          >
            <div
              className="import_btn btn btn_md black"
              onClick={() => setIsModalOpen(true)}
            >
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
              }}
            >
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
              }}
            >
              거래처 정보를 불러오는 중...
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
              <div className="table_item">
                <h2 className="table_title">기본 정보</h2>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">거래처 사업자등록번호</div>
                    <div className="table_data">
                      {clientData?.businessRegistrationNumber || "-"}
                    </div>
                  </li>
                </ul>

                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">상호(법인명)</div>
                    <div className="table_data">{clientData?.name || "-"}</div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">대표자</div>
                    <div className="table_data">
                      {clientData?.ceoName || "-"}
                    </div>
                  </li>
                </ul>

                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">사업자 주소</div>
                    <div className="table_data">
                      {clientData
                        ? `${clientData.address || ""} ${
                            clientData.addressDetail || ""
                          }`.trim() || "-"
                        : "-"}
                    </div>
                  </li>
                </ul>

                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">업태</div>
                    <div className="table_data">
                      {clientData?.businessType || "-"}
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">종목</div>
                    <div className="table_data">
                      {clientData?.businessItem || "-"}
                    </div>
                  </li>
                </ul>

                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">사업자 등록증 첨부</div>
                    <div className="table_data attach">
                      {businessRegistrationFile?.fileName || "-"}
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">서명 등록</div>
                    <div className="table_data attach">
                      {signatureFile?.fileName || "-"}
                    </div>
                  </li>
                </ul>

                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">휴·폐업 상태</div>
                    <div className="table_data">
                      {clientData?.status || "-"}
                    </div>
                  </li>
                </ul>
              </div>

              {/* 관리 상품 정보 */}
              <div className="table_item">
                <h2 className="table_title">관리 상품 정보</h2>
                <div className="table_wrap">
                  {productType1 === "deduct" ? (
                    <>
                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">관리 상품 유형1</div>
                          <div className="table_data">
                            <input
                              type="radio"
                              id="ptype1_deduct"
                              name="product_type1"
                              value="deduct"
                              checked={true}
                              onChange={(e) => {
                                const newType = e.target.value as
                                  | "deduct"
                                  | "maintenance";
                                setProductType1(newType);
                                setProductType2("");
                                // 유형 변경 시 다른 유형의 입력값 초기화
                                if (newType === "deduct") {
                                  setDetailTextEditCount("");
                                  setDetailCodingEditCount("");
                                  setDetailImageEditCount("");
                                  setDetailPopupDesignCount("");
                                  setDetailBannerDesignCount("");
                                } else {
                                  setTotalAmount("");
                                }
                              }}
                            />
                            <label htmlFor="ptype1_deduct">금액차감형</label>

                            <input
                              type="radio"
                              id="ptype1_maintenance"
                              name="product_type1"
                              value="maintenance"
                              checked={false}
                              onChange={(e) => {
                                const newType = e.target.value as
                                  | "deduct"
                                  | "maintenance";
                                setProductType1(newType);
                                setProductType2("");
                                // 유형 변경 시 다른 유형의 입력값 초기화
                                if (newType === "deduct") {
                                  setDetailTextEditCount("");
                                  setDetailCodingEditCount("");
                                  setDetailImageEditCount("");
                                  setDetailPopupDesignCount("");
                                  setDetailBannerDesignCount("");
                                } else {
                                  setTotalAmount("");
                                }
                              }}
                            />
                            <label htmlFor="ptype1_maintenance">
                              유지보수형
                            </label>
                          </div>
                        </li>
                      </ul>
                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">관리 상품 유형2</div>
                          <div className="table_data">
                            <input
                              type="radio"
                              id="ptype2_3m"
                              name="product_type2"
                              value="3m"
                              checked={productType2 === "3m"}
                              onChange={(e) => setProductType2(e.target.value)}
                            />
                            <label htmlFor="ptype2_3m">3개월</label>

                            <input
                              type="radio"
                              id="ptype2_6m"
                              name="product_type2"
                              value="6m"
                              checked={productType2 === "6m"}
                              onChange={(e) => setProductType2(e.target.value)}
                            />
                            <label htmlFor="ptype2_6m">6개월</label>

                            <input
                              type="radio"
                              id="ptype2_9m"
                              name="product_type2"
                              value="9m"
                              checked={productType2 === "9m"}
                              onChange={(e) => setProductType2(e.target.value)}
                            />
                            <label htmlFor="ptype2_9m">9개월</label>

                            <input
                              type="radio"
                              id="ptype2_12m"
                              name="product_type2"
                              value="12m"
                              checked={productType2 === "12m"}
                              onChange={(e) => setProductType2(e.target.value)}
                            />
                            <label htmlFor="ptype2_12m">12개월</label>
                          </div>
                        </li>
                      </ul>
                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">총 금액</div>
                          <div className="table_data pd12">
                            <input
                              type="text"
                              id="price_d"
                              name="price_d"
                              value={
                                totalAmount
                                  ? parseInt(totalAmount).toLocaleString()
                                  : ""
                              }
                              onChange={(e) => {
                                const value = e.target.value.replace(/,/g, "");
                                // 숫자만 허용
                                if (value === "" || /^\d+$/.test(value)) {
                                  setTotalAmount(value);
                                }
                              }}
                              required
                              placeholder="0"
                            />
                          </div>
                        </li>
                        <li className="row_group">
                          <div className="table_head">납부 진행</div>
                          <div className="table_data">
                            <input
                              type="radio"
                              id="payment_paid_d"
                              name="payment_status_d"
                              value="paid"
                              checked={paymentStatus === "paid"}
                              onChange={(e) =>
                                setPaymentStatus(
                                  e.target.value as "paid" | "unpaid"
                                )
                              }
                            />
                            <label htmlFor="payment_paid_d">완납</label>

                            <input
                              type="radio"
                              id="payment_unpaid_d"
                              name="payment_status_d"
                              value="unpaid"
                              checked={paymentStatus === "unpaid"}
                              onChange={(e) =>
                                setPaymentStatus(
                                  e.target.value as "paid" | "unpaid"
                                )
                              }
                            />
                            <label htmlFor="payment_unpaid_d">미납</label>
                          </div>
                        </li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">관리 상품 유형1</div>
                          <div className="table_data">
                            <input
                              type="radio"
                              id="ptype1_deduct_m"
                              name="product_type1_m"
                              value="deduct"
                              checked={false}
                              onChange={(e) => {
                                const newType = e.target.value as
                                  | "deduct"
                                  | "maintenance";
                                setProductType1(newType);
                                setProductType2("");
                                // 유형 변경 시 다른 유형의 입력값 초기화
                                if (newType === "deduct") {
                                  setDetailTextEditCount("");
                                  setDetailCodingEditCount("");
                                  setDetailImageEditCount("");
                                  setDetailPopupDesignCount("");
                                  setDetailBannerDesignCount("");
                                } else {
                                  setTotalAmount("");
                                }
                              }}
                            />
                            <label htmlFor="ptype1_deduct_m">금액차감형</label>

                            <input
                              type="radio"
                              id="ptype1_maintenance_m"
                              name="product_type1_m"
                              value="maintenance"
                              checked={true}
                              onChange={(e) => {
                                const newType = e.target.value as
                                  | "deduct"
                                  | "maintenance";
                                setProductType1(newType);
                                setProductType2("");
                                // 유형 변경 시 다른 유형의 입력값 초기화
                                if (newType === "deduct") {
                                  setDetailTextEditCount("");
                                  setDetailCodingEditCount("");
                                  setDetailImageEditCount("");
                                  setDetailPopupDesignCount("");
                                  setDetailBannerDesignCount("");
                                } else {
                                  setTotalAmount("");
                                }
                              }}
                            />
                            <label htmlFor="ptype1_maintenance_m">
                              유지보수형
                            </label>
                          </div>
                        </li>
                        <li className="row_group">
                          <div className="table_head">납부 진행</div>
                          <div className="table_data">
                            <input
                              type="radio"
                              id="payment_paid_m"
                              name="payment_status_m"
                              value="paid"
                              checked={paymentStatus === "paid"}
                              onChange={(e) =>
                                setPaymentStatus(
                                  e.target.value as
                                    | "paid"
                                    | "prepaid"
                                    | "unpaid"
                                )
                              }
                            />
                            <label htmlFor="payment_paid_m">완납</label>

                            <input
                              type="radio"
                              id="payment_prepaid_m"
                              name="payment_status_m"
                              value="prepaid"
                              checked={paymentStatus === "prepaid"}
                              onChange={(e) =>
                                setPaymentStatus(
                                  e.target.value as
                                    | "paid"
                                    | "prepaid"
                                    | "unpaid"
                                )
                              }
                            />
                            <label htmlFor="payment_prepaid_m">선납</label>

                            <input
                              type="radio"
                              id="payment_unpaid_m"
                              name="payment_status_m"
                              value="unpaid"
                              checked={paymentStatus === "unpaid"}
                              onChange={(e) =>
                                setPaymentStatus(
                                  e.target.value as
                                    | "paid"
                                    | "prepaid"
                                    | "unpaid"
                                )
                              }
                            />
                            <label htmlFor="payment_unpaid_m">미납</label>
                          </div>
                        </li>
                      </ul>
                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">관리 상품 유형2</div>
                          <div className="table_data">
                            <input
                              type="radio"
                              id="ptype2_standard_m"
                              name="product_type2_m"
                              value="standard"
                              checked={productType2 === "standard"}
                              onChange={(e) => {
                                setProductType2(e.target.value);
                                // 스탠다드 기본값 설정
                                setDetailTextEditCount("3");
                                setDetailCodingEditCount("3");
                                setDetailImageEditCount("2");
                                setDetailPopupDesignCount("1");
                                setDetailBannerDesignCount("");
                              }}
                            />
                            <label htmlFor="ptype2_standard_m">스탠다드</label>

                            <input
                              type="radio"
                              id="ptype2_premium_m"
                              name="product_type2_m"
                              value="premium"
                              checked={productType2 === "premium"}
                              onChange={(e) => {
                                setProductType2(e.target.value);
                                // 프리미엄 기본값 설정
                                setDetailTextEditCount("5");
                                setDetailCodingEditCount("5");
                                setDetailImageEditCount("5");
                                setDetailPopupDesignCount("3");
                                setDetailBannerDesignCount("2");
                              }}
                            />
                            <label htmlFor="ptype2_premium_m">프리미엄</label>
                          </div>
                        </li>
                      </ul>
                      <ul className="table_row">
                        <li className="row_group">
                          <div className="table_head">세부 내용</div>
                          <div
                            className="table_data pd12"
                            style={{ width: "50%" }}
                          >
                            <div className="input_group">
                              <span className="prefix">영역 텍스트 수정</span>
                              <input
                                type="number"
                                name="detail1_m"
                                value={detailTextEditCount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // 숫자만 허용
                                  if (value === "" || /^\d+$/.test(value)) {
                                    setDetailTextEditCount(value);
                                  }
                                }}
                                required
                                min="0"
                                step="1"
                                style={{
                                  color: isChanged(
                                    "textEdit",
                                    detailTextEditCount
                                  )
                                    ? "#dc2626"
                                    : "inherit",
                                  fontWeight: isChanged(
                                    "textEdit",
                                    detailTextEditCount
                                  )
                                    ? "600"
                                    : "inherit",
                                }}
                              />
                              <span className="suffix">회</span>
                            </div>
                            <div className="input_group">
                              <span className="prefix">코딩 수정</span>
                              <input
                                type="number"
                                name="detail2_m"
                                value={detailCodingEditCount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // 숫자만 허용
                                  if (value === "" || /^\d+$/.test(value)) {
                                    setDetailCodingEditCount(value);
                                  }
                                }}
                                required
                                min="0"
                                step="1"
                                style={{
                                  color: isChanged(
                                    "codingEdit",
                                    detailCodingEditCount
                                  )
                                    ? "#dc2626"
                                    : "inherit",
                                  fontWeight: isChanged(
                                    "codingEdit",
                                    detailCodingEditCount
                                  )
                                    ? "600"
                                    : "inherit",
                                }}
                              />
                              <span className="suffix">회</span>
                            </div>
                            <div className="input_group">
                              <span className="prefix">
                                기존 결과물 이미지 수정
                              </span>
                              <input
                                type="number"
                                name="detail3_m"
                                value={detailImageEditCount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // 숫자만 허용
                                  if (value === "" || /^\d+$/.test(value)) {
                                    setDetailImageEditCount(value);
                                  }
                                }}
                                required
                                min="0"
                                step="1"
                                style={{
                                  color: isChanged(
                                    "imageEdit",
                                    detailImageEditCount
                                  )
                                    ? "#dc2626"
                                    : "inherit",
                                  fontWeight: isChanged(
                                    "imageEdit",
                                    detailImageEditCount
                                  )
                                    ? "600"
                                    : "inherit",
                                }}
                              />
                              <span className="suffix">회</span>
                            </div>
                            <div className="input_group">
                              <span className="prefix">팝업 디자인</span>
                              <input
                                type="number"
                                name="detail4_m"
                                value={detailPopupDesignCount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // 숫자만 허용
                                  if (value === "" || /^\d+$/.test(value)) {
                                    setDetailPopupDesignCount(value);
                                  }
                                }}
                                required
                                min="0"
                                step="1"
                                style={{
                                  color: isChanged(
                                    "popupDesign",
                                    detailPopupDesignCount
                                  )
                                    ? "#dc2626"
                                    : "inherit",
                                  fontWeight: isChanged(
                                    "popupDesign",
                                    detailPopupDesignCount
                                  )
                                    ? "600"
                                    : "inherit",
                                }}
                              />
                              <span className="suffix">회</span>
                            </div>
                            {productType2 === "premium" && (
                              <div className="input_group">
                                <span className="prefix">신규 배너 디자인</span>
                                <input
                                  type="number"
                                  name="detail5_m"
                                  value={detailBannerDesignCount}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // 숫자만 허용
                                    if (value === "" || /^\d+$/.test(value)) {
                                      setDetailBannerDesignCount(value);
                                    }
                                  }}
                                  required
                                  min="0"
                                  step="1"
                                  style={{
                                    color: isChanged(
                                      "bannerDesign",
                                      detailBannerDesignCount
                                    )
                                      ? "#dc2626"
                                      : "inherit",
                                    fontWeight: isChanged(
                                      "bannerDesign",
                                      detailBannerDesignCount
                                    )
                                      ? "600"
                                      : "inherit",
                                  }}
                                />
                                <span className="suffix">회</span>
                              </div>
                            )}
                          </div>
                        </li>
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* 담당자 정보 */}
              <div className="table_item">
                <h2 className="table_title">
                  담당자 정보
                  <button
                    type="button"
                    onClick={() => setIsContactsOpen(!isContactsOpen)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      src="/images/arrow_icon.svg"
                      alt=""
                      width={16}
                      height={16}
                      className={`${styles.tableToggle} ${
                        !isContactsOpen ? styles.rotated : ""
                      }`}
                    />
                  </button>
                </h2>
                {isContactsOpen && (
                  <div className="table_wrap">
                    {clientData && clientData.contacts.length > 0 ? (
                      clientData.contacts.map((contact, index) => (
                        <div key={index}>
                          <h3 className="table_title_sub">담당자{index + 1}</h3>
                          <ul className="table_row">
                            <li className="row_group">
                              <div className="table_head">이름</div>
                              <div className="table_data">{contact.name}</div>
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
                        거래처를 선택하면 담당자 정보가 표시됩니다.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 사이트 정보 */}
              <div className="table_item table_item2">
                <h2 className="table_title">
                  사이트 정보
                  <button
                    type="button"
                    onClick={() => setIsSitesOpen(!isSitesOpen)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      src="/images/arrow_icon.svg"
                      alt=""
                      width={16}
                      height={16}
                      className={`${styles.tableToggle} ${
                        !isSitesOpen ? styles.rotated : ""
                      }`}
                    />
                  </button>
                </h2>
                {isSitesOpen && (
                  <div className="table_wrap">
                    {clientData && clientData.sites.length > 0 ? (
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
                              <td data-th="브랜드">{site.brandName || "-"}</td>
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
                        거래처를 선택하면 사이트 정보가 표시됩니다.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 비고 */}
              {clientData?.note && (
                <div className="table_item">
                  <h2 className="table_title">
                    비고
                    <button
                      type="button"
                      onClick={() => setIsNoteOpen(!isNoteOpen)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        src="/images/arrow_icon.svg"
                        alt=""
                        width={16}
                        height={16}
                        className={`${styles.tableToggle} ${
                          !isNoteOpen ? styles.rotated : ""
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
            </div>
          </div>
        </div>
      </form>

      <ClientSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectClient}
      />
    </section>
  );
}
