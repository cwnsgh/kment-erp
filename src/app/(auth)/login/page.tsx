"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "", // 아이디 또는 이메일
    password: "",
    remember: true,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(form.username, form.password);

      if (!result.success) {
        setError(result.error || "로그인에 실패했습니다.");
        setIsLoading(false);
      }
      // 성공 시 login 함수에서 redirect 처리
    } catch (err) {
      setError("로그인 처리 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex w-full min-h-full flex-col items-center justify-center md:flex-row">
      <span className="pointer-events-none absolute left-1/2 top-[-5%] hidden h-[120%] w-[1px] -translate-x-1/2 rounded-full bg-slate-200 md:block" />

      <section className="flex flex-1 flex-col justify-center gap-12 px-10 py-16 md:px-16">
        <div className="space-y-6">
          <p className="max-w-xl text-[32px] font-bold leading-relaxed text-slate-900">
            본 사이트는 케이멘트 고객 전용입니다.
            <br />
            회원가입 후 이용해 주세요.
          </p>
        </div>
        <div className="space-y-6 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-500">대표전화</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              1800 - 8413
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-500">대표메일</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              kment@kmentcorp.co.kr
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col justify-center px-10 py-16 md:px-16">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
          LOGIN
        </h2>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium text-slate-700">
            아이디 또는 이메일
            <input
              type="text"
              value={form.username}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, username: event.target.value }))
              }
              placeholder="직원은 이메일, 사업자는 아이디를 입력하세요"
              required
              disabled={isLoading}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-slate-500">
              직원: 아이디 또는 이메일 | 사업자: 아이디
            </p>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            비밀번호
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="비밀번호를 입력하세요"
              required
              disabled={isLoading}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </label>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <label className="inline-flex items-center gap-2 font-medium text-slate-600">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    remember: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              아이디 기억하기
            </label>
            <button type="button" className="text-slate-400 hover:text-primary">
              비밀번호 변경하기
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[7px] bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
          <Link
            href="/signup"
            className="flex w-full items-center justify-center rounded-[7px] border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
          >
            회원가입
          </Link>
        </form>
      </section>
    </div>
  );
}
