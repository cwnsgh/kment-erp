"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { login } from "@/app/actions/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const [userType, setUserType] = useState<"employee" | "client">("client");
  const [form, setForm] = useState({
    username: "", // 아이디 또는 이메일
    password: "",
    remember: true,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpBox, setShowHelpBox] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(form.username, form.password, userType);

      // result가 undefined인 경우 redirect가 발생한 것으로 간주 (redirect는 예외를 던지므로 result를 반환하지 않음)
      if (result && !result.success) {
        setError(result.error || "로그인에 실패했습니다.");
        setIsLoading(false);
      }
      // 성공 시 login 함수에서 redirect 처리됨 (redirect는 예외를 던지므로 여기서는 처리하지 않음)
    } catch (err: any) {
      // Next.js redirect는 예외를 던져서 리다이렉트를 수행합니다
      // redirect 관련 예외는 그대로 전파하고, 실제 에러만 처리합니다
      const isRedirectError =
        err &&
        typeof err === "object" &&
        ("digest" in err ||
          err.message?.includes("NEXT_REDIRECT") ||
          err.code === "NEXT_REDIRECT");

      if (isRedirectError) {
        // redirect 예외는 무시하고 아무것도 하지 않음 (리다이렉트가 처리됨)
        // 상태 업데이트를 하지 않음으로써 UI에 에러 메시지가 나타나지 않도록 함
        return;
      }

      // 실제 에러인 경우에만 에러 메시지 표시
      setError("로그인 처리 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const toggleHelpBox = () => {
    setShowHelpBox(!showHelpBox);
  };

  return (
    <section className={styles.loginPage}>
      <div className={styles.loginLeft}>
        <h1>
          본 사이트는 케이먼트 고객 전용입니다.
          <br />
          회원가입 후 이용해 주세요.
        </h1>
        <div className={styles.csBox}>
          <div>
            <span>대표전화</span>
            <h2>1800-8413</h2>
          </div>
          <div>
            <span>대표메일</span>
            <h2>kment@kmentcorp.co.kr</h2>
          </div>
        </div>
      </div>
      <div className={styles.loginRight}>
        <h3>LOGIN</h3>
        <div className={styles.loginTabs}>
          <button
            type="button"
            className={`${styles.loginTab} ${
              userType === "client" ? styles.active : ""
            }`}
            onClick={() => setUserType("client")}
            disabled={isLoading}
          >
            사업자 로그인
          </button>
          <button
            type="button"
            className={`${styles.loginTab} ${
              userType === "employee" ? styles.active : ""
            }`}
            onClick={() => setUserType("employee")}
            disabled={isLoading}
          >
            직원 로그인
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <input
            type="text"
            placeholder={userType === "employee" ? "이메일" : "아이디"}
            value={form.username}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, username: event.target.value }))
            }
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            required
            disabled={isLoading}
          />
          <div className={styles.inputBot}>
            <div>
              <input
                type="checkbox"
                id="remember_id"
                checked={form.remember}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    remember: event.target.checked,
                  }))
                }
                disabled={isLoading}
              />
              <label htmlFor="remember_id">아이디 기억하기</label>
            </div>
            <div className={styles.helpBox}>
              <p onClick={toggleHelpBox}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ flexShrink: 0 }}
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <text
                    x="8"
                    y="11.5"
                    textAnchor="middle"
                    fontSize="10"
                    fill="currentColor"
                    fontWeight="bold"
                  >
                    ?
                  </text>
                </svg>
                비밀번호를 분실했어요
              </p>
              <div
                className={`${styles.boxContent} ${
                  showHelpBox ? styles.open : ""
                }`}
              >
                <p>
                  비밀번호 분실 시, 케이먼트 대표 이메일로 아래 내용을
                  보내주세요.
                  <span>1. 사업자 등록증</span>
                  <span>2. 보내시는 분의 명함 이미지</span>
                  제출된 내용 확인 후, 임시 비밀번호를 안내해드립니다.
                </p>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.closeBtn}
                  onClick={toggleHelpBox}
                >
                  <path
                    d="M1 1L11 11M11 1L1 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className={styles.btnWrap}>
            <button type="submit" className="btn primary" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
            <Link href="/signup" className="btn normal">
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
