"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getManagedClientDetail,
  deleteManagedClients,
} from "@/app/actions/managed-client";
import styles from "../page.module.css";

type ManagedClientDetail = {
  id: string;
  clientId: string;
  productType1: "deduct" | "maintenance";
  productType2: string;
  totalAmount: number | null;
  initialTotalAmount: number | null;
  usedAmount: number;
  remainingAmount: number | null;
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
  createdAt: string;
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

export default function ManagedClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const managedClientId = params.id as string;

  const [managedClient, setManagedClient] =
    useState<ManagedClientDetail | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 토글 상태
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isSitesOpen, setIsSitesOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  useEffect(() => {
    if (managedClientId) {
      loadData();
    }
  }, [managedClientId]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await getManagedClientDetail(managedClientId);
      if (result.success && result.managedClient && result.client) {
        setManagedClient(result.managedClient);
        setClientData(result.client);
        // 디버깅: 브랜드명 확인
        console.log("Client sites (raw):", result.client.sites);
        console.log("Brand names:", result.client.sites?.map(s => ({ brandName: s.brandName, hasValue: !!s.brandName })));
        console.log("Sites count:", result.client.sites?.length);
      } else {
        setError(result.error || "데이터를 불러올 수 없습니다.");
      }
    } catch (err) {
      setError("데이터 로드 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!managedClient) return;

    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const result = await deleteManagedClients([managedClient.id]);
      if (result.success) {
        alert("삭제되었습니다.");
        router.push("/operations/clients");
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatProductType1 = (type: "deduct" | "maintenance") => {
    return type === "deduct" ? "금액차감형" : "유지보수형";
  };

  const formatProductType2 = (type1: string, type2: string) => {
    if (type1 === "deduct") {
      const monthMap: Record<string, string> = {
        "3m": "3개월",
        "6m": "6개월",
        "9m": "9개월",
        "12m": "12개월",
      };
      return monthMap[type2] || type2;
    } else {
      const typeMap: Record<string, string> = {
        standard: "스탠다드",
        premium: "프리미엄",
      };
      return typeMap[type2] || type2;
    }
  };

  const formatPaymentStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      paid: "완납",
      prepaid: "선납",
      unpaid: "미납",
    };
    return statusMap[status] || status;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      ongoing: "진행중",
      wait: "대기",
      end: "종료",
      unpaid: "미납",
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      ongoing: "status_badge ongoing",
      wait: "status_badge wait",
      end: "status_badge end",
      unpaid: "status_badge unpaid",
    };
    return classMap[status] || "";
  };

  const businessRegistrationFile = clientData?.attachments.find(
    (a) => a.fileType === "business_registration"
  );
  const signatureFile = clientData?.attachments.find(
    (a) => a.fileType === "signature"
  );

  if (isLoading) {
    return (
      <div className={styles.manageClientList}>
        <div className={styles.whiteBox}>
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            로딩 중...
          </div>
        </div>
      </div>
    );
  }

  if (error || !managedClient || !clientData) {
    return (
      <div className={styles.manageClientList}>
        <div className={styles.whiteBox}>
          <div
            style={{
              padding: "20px",
              color: "var(--negative)",
              textAlign: "center",
            }}
          >
            {error || "데이터를 불러올 수 없습니다."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.manageClientList}>
      <div className={styles.pageTitle}>
        <h1>관리 고객 상세조회</h1>
        <div className={styles.btnWrap}>
          <button
            type="button"
            className="btn btn_lg normal"
            onClick={() => router.push("/operations/clients")}
          >
            목록
          </button>
          <button
            type="button"
            className="btn btn_lg primary"
            onClick={() =>
              router.push(`/operations/clients/${managedClientId}/edit`)
            }
          >
            수정
          </button>
          <button
            type="button"
            className="btn btn_lg normal"
            onClick={handleDelete}
            style={{ marginLeft: "10px" }}
          >
            삭제
          </button>
        </div>
      </div>

      <div className={styles.whiteBox}>
        <div className={styles.boxInner}>
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
                  <div className="table_data">
                    {clientData.loginPassword ? "••••••••" : "-"}
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
                  <div className="table_data">{clientData.ceoName || "-"}</div>
                </li>
              </ul>

              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">사업자 주소</div>
                  <div className="table_data">
                    {clientData.address || clientData.addressDetail
                      ? `${clientData.address || ""} ${
                          clientData.addressDetail || ""
                        }`.trim()
                      : "-"}
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
                  <div className="table_data">{clientData.status || "-"}</div>
                </li>
              </ul>

              <ul className="table_row">
                <li className="row_group">
                  <div className="table_head">브랜드명</div>
                  <div className="table_data pd12" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {clientData.sites && clientData.sites.length > 0 ? (
                      clientData.sites.map((site, index) => (
                        <div key={`brand-${index}`}>
                          {site.brandName || "-"}
                        </div>
                      ))
                    ) : (
                      <div>-</div>
                    )}
                  </div>
                </li>
              </ul>
            </div>

            {/* 관리 상품 정보 */}
            <div className="table_item">
              <h2 className="table_title">관리 상품 정보</h2>
              <div className="table_wrap">
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">관리 상품 유형1</div>
                    <div className="table_data">
                      <span style={{ color: "var(--primary)" }}>
                        {formatProductType1(managedClient.productType1)}
                      </span>
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">납부 진행</div>
                    <div className="table_data">
                      <span
                        className={getStatusClass(managedClient.paymentStatus)}
                      >
                        {formatPaymentStatus(managedClient.paymentStatus)}
                      </span>
                    </div>
                  </li>
                </ul>
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">관리 상품 유형2</div>
                    <div className="table_data">
                      <span style={{ color: "var(--primary)" }}>
                        {formatProductType2(
                          managedClient.productType1,
                          managedClient.productType2
                        )}
                      </span>
                    </div>
                  </li>
                </ul>
                {managedClient.productType1 === "maintenance" && (
                  <ul className="table_row">
                    <li className="row_group">
                      <div className="table_head">세부 내용</div>
                      <div className="table_data pd12" style={{ width: "50%" }}>
                        <div className="input_group">
                          <span className="prefix">영역 텍스트 수정</span>
                          <span style={{ color: "var(--primary)" }}>
                            {managedClient.detailTextEditCount}
                          </span>
                          <span className="suffix">회</span>
                        </div>
                        <div className="input_group">
                          <span className="prefix">코딩 수정</span>
                          <span style={{ color: "var(--primary)" }}>
                            {managedClient.detailCodingEditCount}
                          </span>
                          <span className="suffix">회</span>
                        </div>
                        <div className="input_group">
                          <span className="prefix">
                            기존 결과물 이미지 수정
                          </span>
                          <span style={{ color: "var(--primary)" }}>
                            {managedClient.detailImageEditCount}
                          </span>
                          <span className="suffix">회</span>
                        </div>
                        <div className="input_group">
                          <span className="prefix">팝업 디자인</span>
                          <span style={{ color: "var(--primary)" }}>
                            {managedClient.detailPopupDesignCount}
                          </span>
                          <span className="suffix">회</span>
                        </div>
                        {managedClient.productType2 === "premium" && (
                          <div className="input_group">
                            <span className="prefix">배너 디자인</span>
                            <span style={{ color: "var(--primary)" }}>
                              {managedClient.detailBannerDesignCount}
                            </span>
                            <span className="suffix">회</span>
                          </div>
                        )}
                      </div>
                    </li>
                  </ul>
                )}
                {managedClient.productType1 === "deduct" && (
                  <>
                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">초기세팅금액(관리금액)</div>
                        <div className="table_data">
                          {managedClient.initialTotalAmount
                            ? managedClient.initialTotalAmount.toLocaleString()
                            : "-"}
                        </div>
                      </li>
                    </ul>
                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">사용금액</div>
                        <div className="table_data">
                          {managedClient.usedAmount !== undefined && managedClient.usedAmount !== null
                            ? managedClient.usedAmount.toLocaleString()
                            : "0"}
                        </div>
                      </li>
                    </ul>
                    <ul className="table_row">
                      <li className="row_group">
                        <div className="table_head">남은금액</div>
                        <div className="table_data">
                          {managedClient.remainingAmount !== null
                            ? managedClient.remainingAmount.toLocaleString()
                            : "-"}
                        </div>
                      </li>
                    </ul>
                  </>
                )}
                <ul className="table_row">
                  <li className="row_group">
                    <div className="table_head">시작일 - 종료일</div>
                    <div className="table_data">
                      {managedClient.startDate && managedClient.endDate
                        ? `${formatDate(
                            managedClient.startDate
                          )} - ${formatDate(managedClient.endDate)}`
                        : "-"}
                    </div>
                  </li>
                  <li className="row_group">
                    <div className="table_head">진행상황</div>
                    <div className="table_data">
                      <span className={getStatusClass(managedClient.status)}>
                        {getStatusLabel(managedClient.status)}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* 담당자 정보 */}
            <div className="table_item">
              <h2
                className="table_title"
                onClick={() => setIsContactsOpen(!isContactsOpen)}
                style={{ cursor: "pointer" }}
              >
                담당자 정보
                <img
                  src="/images/arrow_icon.svg"
                  alt=""
                  width={16}
                  height={16}
                  className={`table_toggle ${
                    isContactsOpen ? styles.rotated : ""
                  }`}
                />
              </h2>
              {isContactsOpen && (
                <div className="table_wrap">
                  {clientData.contacts.map((contact, index) => (
                    <div key={index}>
                      <h3 className="table_title_sub">담당자{index + 1}</h3>
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
                  ))}
                </div>
              )}
            </div>

            {/* 사이트 정보 */}
            <div className="table_item table_item2">
              <h2
                className="table_title"
                onClick={() => setIsSitesOpen(!isSitesOpen)}
                style={{ cursor: "pointer" }}
              >
                사이트 정보
                <img
                  src="/images/arrow_icon.svg"
                  alt=""
                  width={16}
                  height={16}
                  className={`table_toggle ${
                    isSitesOpen ? styles.rotated : ""
                  }`}
                />
              </h2>
              {isSitesOpen && (
                <div className="table_wrap">
                  <table className="site-table">
                    <colgroup>
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "20%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>브랜드</th>
                        <th>도메인</th>
                        <th>솔루션</th>
                        <th>아이디</th>
                        <th>패스워드</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientData.sites.map((site, index) => (
                        <tr key={index} className="site-row">
                          <td>{site.brandName || "-"}</td>
                          <td>{site.domain || "-"}</td>
                          <td>{site.solution || "-"}</td>
                          <td>{site.loginId || "-"}</td>
                          <td>{site.loginPassword || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 비고 */}
            <div className="table_item">
              <h2
                className="table_title"
                onClick={() => setIsNoteOpen(!isNoteOpen)}
                style={{ cursor: "pointer" }}
              >
                비고
                <img
                  src="/images/arrow_icon.svg"
                  alt=""
                  width={16}
                  height={16}
                  className={`table_toggle ${isNoteOpen ? styles.rotated : ""}`}
                />
              </h2>
              {isNoteOpen && (
                <div className="table_wrap">
                  <div className="text_box scroll">
                    <p>{managedClient.note || clientData.note || "-"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
