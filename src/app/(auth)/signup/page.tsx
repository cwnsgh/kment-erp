"use client";

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signup } from "@/app/actions/signup";
import {
  checkBusinessNumber,
  checkUsername,
} from "@/app/actions/signup-validation";
import AddressSearch from "@/components/common/address-search";

type AgreementKey = "terms" | "privacy" | "thirdParty";

type ContactField = "name" | "phone" | "title" | "email";

type Contact = {
  id: string;
  name: string;
  phone: string;
  title: string;
  email: string;
};

type SiteField =
  | "brandName"
  | "domain"
  | "solution"
  | "loginId"
  | "loginPassword"
  | "type";

type Site = {
  id: string;
  brandName: string;
  domain: string;
  solution: string;
  loginId: string;
  loginPassword: string;
  type: string;
};

const agreementItems: {
  id: AgreementKey;
  label: string;
  description: string;
}[] = [
  {
    id: "terms",
    label: "[필수] 이용 약관",
    description: "서비스 이용을 위한 기본 약관에 동의해 주세요.",
  },
  {
    id: "privacy",
    label: "[필수] 개인정보 수집 이용 동의",
    description: "회원 관리와 서비스 제공을 위해 개인정보를 수집·이용합니다.",
  },
  {
    id: "thirdParty",
    label: "[필수] 개인정보 제3자 정보제공 동의",
    description: "계약 이행에 필요한 외부 서비스에 정보를 제공할 수 있습니다.",
  },
];

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingBusinessNumber, setCheckingBusinessNumber] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [businessNumberStatus, setBusinessNumberStatus] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
  }>({ checked: false, available: false });
  const [usernameStatus, setUsernameStatus] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
  }>({ checked: false, available: false });

  const [agreements, setAgreements] = useState<Record<AgreementKey, boolean>>({
    terms: false,
    privacy: false,
    thirdParty: false,
  });

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    businessNumber: "",
    companyName: "",
    ceoName: "",
    postalCode: "",
    address: "",
    addressDetail: "",
    businessType: "",
    businessItem: "",
  });

  const handleAddressComplete = (data: {
    zonecode: string;
    address: string;
    addressType: "R" | "J";
    buildingName?: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      postalCode: data.zonecode,
      address:
        data.address + (data.buildingName ? ` ${data.buildingName}` : ""),
    }));
  };

  const [businessRegistrationFile, setBusinessRegistrationFile] =
    useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const [contacts, setContacts] = useState<Contact[]>([
    { id: createId(), name: "", phone: "", title: "", email: "" },
  ]);

  const [sites, setSites] = useState<Site[]>([
    {
      id: createId(),
      brandName: "",
      domain: "",
      solution: "",
      loginId: "",
      loginPassword: "",
      type: "",
    },
  ]);

  const allChecked = useMemo(
    () => Object.values(agreements).every(Boolean),
    [agreements]
  );

  const handleToggleAll = () => {
    const next = !allChecked;
    setAgreements({
      terms: next,
      privacy: next,
      thirdParty: next,
    });
  };

  const handleAgreementChange = (id: AgreementKey) => {
    setAgreements((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 입력값 변경 시 중복 확인 상태 초기화
    if (name === "username") {
      setUsernameStatus({ checked: false, available: false });
    } else if (name === "businessNumber") {
      setBusinessNumberStatus({ checked: false, available: false });
    }
  };

  const handleCheckUsername = async () => {
    if (!form.username.trim()) {
      alert("아이디를 입력해주세요.");
      return;
    }

    setCheckingUsername(true);
    try {
      const result = await checkUsername(form.username);
      setUsernameStatus({
        checked: true,
        available: result.available,
        message: result.message,
      });
    } catch (error) {
      setUsernameStatus({
        checked: true,
        available: false,
        message: "확인 중 오류가 발생했습니다.",
      });
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleCheckBusinessNumber = async () => {
    if (!form.businessNumber.trim()) {
      alert("사업자등록번호를 입력해주세요.");
      return;
    }

    setCheckingBusinessNumber(true);
    try {
      const result = await checkBusinessNumber(form.businessNumber);
      setBusinessNumberStatus({
        checked: true,
        available: result.available,
        message: result.message,
      });
    } catch (error) {
      setBusinessNumberStatus({
        checked: true,
        available: false,
        message: "확인 중 오류가 발생했습니다.",
      });
    } finally {
      setCheckingBusinessNumber(false);
    }
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    type: "businessRegistration" | "signature"
  ) => {
    const file = event.target.files?.[0] ?? null;
    if (type === "businessRegistration") {
      setBusinessRegistrationFile(file);
    } else {
      setSignatureFile(file);
    }
  };

  const handleContactChange = (
    id: string,
    field: ContactField,
    value: string
  ) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    );
  };

  const addContact = () => {
    setContacts((prev) => [
      ...prev,
      { id: createId(), name: "", phone: "", title: "", email: "" },
    ]);
  };

  const removeContact = (id: string) => {
    setContacts((prev) =>
      prev.length > 1 ? prev.filter((contact) => contact.id !== id) : prev
    );
  };

  const handleSiteChange = (id: string, field: SiteField, value: string) => {
    setSites((prev) =>
      prev.map((site) => (site.id === id ? { ...site, [field]: value } : site))
    );
  };

  const addSite = () => {
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
      },
    ]);
  };

  const removeSite = (id: string) => {
    setSites((prev) =>
      prev.length > 1 ? prev.filter((site) => site.id !== id) : prev
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 필수 약관 체크
    if (!allChecked) {
      alert("필수 약관에 동의해주세요.");
      return;
    }

    // 비밀번호 확인
    if (form.password !== form.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 필수 입력 확인
    if (
      !form.username ||
      !form.password ||
      !form.businessNumber ||
      !form.companyName
    ) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    // 중복 확인 완료 여부 확인
    if (!usernameStatus.checked || !usernameStatus.available) {
      alert("아이디 중복 확인을 완료해주세요.");
      return;
    }

    if (!businessNumberStatus.checked || !businessNumberStatus.available) {
      alert("사업자등록번호 중복 확인을 완료해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 1. 파일 업로드 (있는 경우)
      let businessRegistrationFileUrl: string | undefined;
      let businessRegistrationFileName: string | undefined;
      let signatureFileUrl: string | undefined;
      let signatureFileName: string | undefined;

      if (businessRegistrationFile) {
        const formData = new FormData();
        formData.append("file", businessRegistrationFile);
        formData.append("folder", "business-registration");

        const uploadResponse = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "사업자등록증 업로드 실패");
        }
        businessRegistrationFileUrl = uploadResult.url;
        businessRegistrationFileName = uploadResult.fileName;
      }

      if (signatureFile) {
        const formData = new FormData();
        formData.append("file", signatureFile);
        formData.append("folder", "signature");

        const uploadResponse = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "서명 파일 업로드 실패");
        }
        signatureFileUrl = uploadResult.url;
        signatureFileName = uploadResult.fileName;
      }

      // 2. 회원가입 데이터 저장
      const result = await signup({
        username: form.username,
        password: form.password,
        businessNumber: form.businessNumber,
        companyName: form.companyName,
        ceoName: form.ceoName,
        address: form.address,
        addressDetail: form.addressDetail,
        businessType: form.businessType,
        businessItem: form.businessItem,
        contacts: contacts.map((c) => ({
          name: c.name,
          phone: c.phone,
          email: c.email,
          title: c.title,
        })),
        sites: sites.map((s) => ({
          brandName: s.brandName,
          domain: s.domain,
          solution: s.solution,
          loginId: s.loginId,
          loginPassword: s.loginPassword,
          type: s.type,
        })),
        businessRegistrationFileUrl,
        businessRegistrationFileName,
        signatureFileUrl,
        signatureFileName,
      });

      setLoading(false);

      if (result.success) {
        alert("회원가입 요청이 제출되었습니다. 승인 후 로그인이 가능합니다.");
        router.push("/login");
      } else {
        alert("회원가입 실패: " + result.error);
      }
    } catch (error) {
      setLoading(false);
      alert(
        "오류가 발생했습니다: " +
          (error instanceof Error ? error.message : "알 수 없는 오류")
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white p-8 rounded-lg shadow-sm max-w-xl mx-auto"
    >
      <h1 className="text-2xl font-semibold text-slate-900 mb-8">회원가입</h1>

      <section className="space-y-4">
        <p className="text-sm text-slate-600 mb-4">
          필수항목 및 선택항목 약관에 동의해 주세요.
        </p>
        <label className="flex cursor-pointer items-center gap-3 py-3">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={handleToggleAll}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium text-slate-800">
            전체 약관 동의
          </span>
        </label>
        <div className="space-y-3 pl-7">
          {agreementItems.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 py-2"
            >
              <input
                type="checkbox"
                checked={agreements[item.id]}
                onChange={() => handleAgreementChange(item.id)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-slate-800">
                {item.label}
              </span>
              <span className="text-slate-400">→</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-6 border-t border-slate-200 pt-8 mt-8">
        <h2 className="text-lg font-semibold text-slate-900">가입 정보 입력</h2>
        <p className="text-sm text-slate-600 mb-6">
          * 표시는 반드시 입력하셔야 합니다.
        </p>
        <div className="space-y-4">
          <div>
            <TextField
              label="아이디 *"
              name="username"
              placeholder="영문소문자/숫자 조합, 4~16자"
              value={form.username}
              onChange={handleInputChange}
              suffix={
                <button
                  type="button"
                  onClick={handleCheckUsername}
                  disabled={checkingUsername || !form.username.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingUsername ? "확인중..." : "중복확인"}
                </button>
              }
            />
            {usernameStatus.checked && (
              <p
                className={`mt-1 ml-[156px] text-xs ${
                  usernameStatus.available ? "text-green-600" : "text-red-600"
                }`}
              >
                {usernameStatus.message}
              </p>
            )}
          </div>
          <PasswordField
            label="비밀번호 *"
            name="password"
            value={form.password}
            onChange={handleInputChange}
            placeholder="대소문자/숫자/특수문자 중 3가지 이상 조합, 8자~16자"
          />
          <PasswordField
            label="비밀번호 확인 *"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleInputChange}
            placeholder="비밀번호를 다시 입력하세요"
          />
        </div>
      </section>

      <section className="space-y-6 border-t border-slate-200 pt-8 mt-8">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            사업자 정보 입력
          </h2>
          <div className="border-t border-slate-200"></div>
        </div>
        <div className="space-y-4">
          <div>
            <TextField
              label="사업자등록번호 *"
              name="businessNumber"
              placeholder="숫자만 입력"
              value={form.businessNumber}
              onChange={handleInputChange}
              suffix={
                <button
                  type="button"
                  onClick={handleCheckBusinessNumber}
                  disabled={
                    checkingBusinessNumber || !form.businessNumber.trim()
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingBusinessNumber ? "확인중..." : "중복확인"}
                </button>
              }
            />
            {businessNumberStatus.checked && (
              <p
                className={`mt-1 ml-[156px] text-xs ${
                  businessNumberStatus.available
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {businessNumberStatus.message}
              </p>
            )}
          </div>
          <TextField
            label="상호(법인명) *"
            name="companyName"
            placeholder="예: 케이멘트 주식회사"
            value={form.companyName}
            onChange={handleInputChange}
          />
          <TextField
            label="대표자 *"
            name="ceoName"
            placeholder="대표자 성함"
            value={form.ceoName}
            onChange={handleInputChange}
          />
          <TextField
            label="사업자주소 *"
            name="address"
            placeholder="도로명 주소"
            value={form.address}
            onChange={handleInputChange}
            suffix={
              <AddressSearch onComplete={handleAddressComplete}>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90"
                >
                  주소검색
                </button>
              </AddressSearch>
            }
          />
          {form.postalCode && (
            <TextField
              label="우편번호"
              name="postalCode"
              value={form.postalCode}
              onChange={handleInputChange}
              readOnly
              className="opacity-75"
            />
          )}
          <TextField
            label="상세 주소"
            name="addressDetail"
            placeholder="건물, 층/호수 등 추가 정보"
            value={form.addressDetail}
            onChange={handleInputChange}
          />
          <TextField
            label="업태 *"
            name="businessType"
            placeholder="예: 도소매"
            value={form.businessType}
            onChange={handleInputChange}
          />
          <TextField
            label="종목 *"
            name="businessItem"
            placeholder="예: 소프트웨어 개발"
            value={form.businessItem}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-4">
          <FileField
            label="사업자 등록증 첨부"
            file={businessRegistrationFile}
            onChange={(event) =>
              handleFileChange(event, "businessRegistration")
            }
          />
          <FileField
            label="서명 등록"
            description="*관리상품 고객의 경우 필수로 등록해주세요."
            file={signatureFile}
            onChange={(event) => handleFileChange(event, "signature")}
          />
        </div>

        <div className="space-y-5 border-t border-slate-200 pt-8 mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              담당자 정보
            </h3>
            <button
              type="button"
              onClick={addContact}
              className="text-sm font-medium text-primary hover:underline"
            >
              + 담당자 추가
            </button>
          </div>
          <div className="space-y-4">
            {contacts.map((contact, index) => (
              <div
                key={contact.id}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-slate-900">
                    담당자 {index + 1}
                  </h4>
                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(contact.id)}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                      title="삭제"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <Input
                    label="이름 *"
                    value={contact.name}
                    onChange={(event) =>
                      handleContactChange(
                        contact.id,
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="담당자 이름"
                  />
                  <Input
                    label="이메일 *"
                    value={contact.email}
                    onChange={(event) =>
                      handleContactChange(
                        contact.id,
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="example@company.com"
                    type="email"
                  />
                  <PhoneInputField
                    label="휴대폰 번호 *"
                    value={contact.phone}
                    onChange={(value) =>
                      handleContactChange(contact.id, "phone", value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 border-t border-slate-200 pt-8 mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              사이트 정보
            </h3>
            <button
              type="button"
              onClick={addSite}
              className="text-sm font-medium text-primary hover:underline"
            >
              + 사이트 추가
            </button>
          </div>
          <div className="space-y-4">
            {sites.map((site, index) => (
              <div
                key={site.id}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-slate-900">
                    사이트 {index + 1}
                  </h4>
                  {sites.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSite(site.id)}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                      title="삭제"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <Input
                    label="브랜드"
                    value={site.brandName}
                    onChange={(event) =>
                      handleSiteChange(site.id, "brandName", event.target.value)
                    }
                    placeholder="브랜드명"
                  />
                  <Input
                    label="도메인"
                    value={site.domain}
                    onChange={(event) =>
                      handleSiteChange(site.id, "domain", event.target.value)
                    }
                    placeholder="example.com"
                  />
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <label className="text-sm font-medium text-slate-700">
                      솔루션
                    </label>
                    <select
                      value={site.solution}
                      onChange={(event) =>
                        handleSiteChange(
                          site.id,
                          "solution",
                          event.target.value
                        )
                      }
                      className="w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">선택하세요</option>
                      <option value="카페24">카페24</option>
                      <option value="고도몰">고도몰</option>
                      <option value="메이크샵">메이크샵</option>
                      <option value="아임웹">아임웹</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <Input
                    label="관리자 아이디"
                    value={site.loginId}
                    onChange={(event) =>
                      handleSiteChange(site.id, "loginId", event.target.value)
                    }
                    placeholder="관리자 로그인 아이디"
                  />
                  <Input
                    label="관리자 패스워드"
                    value={site.loginPassword}
                    onChange={(event) =>
                      handleSiteChange(
                        site.id,
                        "loginPassword",
                        event.target.value
                      )
                    }
                    placeholder="관리자 로그인 패스워드"
                    type="password"
                  />
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <label className="text-sm font-medium text-slate-700">
                      유형
                    </label>
                    <select
                      value={site.type}
                      onChange={(event) =>
                        handleSiteChange(site.id, "type", event.target.value)
                      }
                      className="w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">선택하세요</option>
                      <option value="신규">신규</option>
                      <option value="리뉴얼">리뉴얼</option>
                      <option value="이전">이전</option>
                      <option value="개발">개발</option>
                      <option value="유지보수">유지보수</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex justify-center pt-8 border-t border-slate-200 mt-8">
        <button
          type="submit"
          disabled={!allChecked || loading}
          className="inline-flex w-full justify-center bg-primary px-8 py-4 text-base font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "처리 중..." : "회원가입"}
        </button>
      </div>
    </form>
  );
}

type TextFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  suffix?: ReactNode;
  readOnly?: boolean;
  className?: string;
};

function TextField({
  label,
  name,
  placeholder,
  value,
  onChange,
  suffix,
  readOnly,
  className,
}: TextFieldProps) {
  return (
    <div
      className={`grid grid-cols-[140px_1fr] items-center gap-4 ${
        className || ""
      }`}
    >
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className="flex-1 rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
        {suffix}
      </div>
    </div>
  );
}

type PasswordFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
};

function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
}: PasswordFieldProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

type FileFieldProps = {
  label: string;
  description?: string;
  file: File | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  extraAction?: ReactNode;
};

function FileField({
  label,
  description,
  file,
  onChange,
  extraAction,
}: FileFieldProps) {
  const inputId = useMemo(
    () => label.replace(/\s+/g, "-").toLowerCase(),
    [label]
  );

  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="file"
          onChange={onChange}
          className="hidden"
          id={inputId}
        />
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-slate-500 rounded hover:bg-slate-600"
        >
          <span>첨부파일</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        </label>
        {description && (
          <span className="text-xs text-slate-500">{description}</span>
        )}
        {file && (
          <span className="text-sm text-slate-600">
            {file.name} ({Math.round(file.size / 1024)}KB)
          </span>
        )}
      </div>
      {extraAction && <div className="col-start-2">{extraAction}</div>}
    </div>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
};

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: InputProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

type PhoneInputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function PhoneInputField({ label, value, onChange }: PhoneInputFieldProps) {
  // phone value를 파싱: "010-1234-5678" 형식
  const parts = value.split("-");
  const prefix = parts[0] || "010";
  const middle = parts[1] || "";
  const last = parts[2] || "";

  const handlePrefixChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newPrefix = e.target.value;
    onChange(`${newPrefix}-${middle}-${last}`.replace(/-+$/, ""));
  };

  const handleMiddleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newMiddle = e.target.value.replace(/\D/g, "").slice(0, 4);
    onChange(`${prefix}-${newMiddle}-${last}`.replace(/-+$/, ""));
  };

  const handleLastChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newLast = e.target.value.replace(/\D/g, "").slice(0, 4);
    onChange(`${prefix}-${middle}-${newLast}`.replace(/-+$/, ""));
  };

  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <select
          value={prefix}
          onChange={handlePrefixChange}
          className="w-16 rounded border border-slate-200 px-2 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="010">010</option>
          <option value="011">011</option>
          <option value="016">016</option>
          <option value="017">017</option>
          <option value="018">018</option>
          <option value="019">019</option>
        </select>
        <span className="text-slate-400">-</span>
        <input
          type="text"
          value={middle}
          onChange={handleMiddleChange}
          placeholder="1234"
          maxLength={4}
          className="w-16 rounded border border-slate-200 px-2 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-center"
        />
        <span className="text-slate-400">-</span>
        <input
          type="text"
          value={last}
          onChange={handleLastChange}
          placeholder="5678"
          maxLength={4}
          className="w-16 rounded border border-slate-200 px-2 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-center"
        />
      </div>
    </div>
  );
}
