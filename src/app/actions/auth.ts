"use server";

import bcrypt from "bcryptjs";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * 로그인 (직원 또는 사업자)
 * 이메일 형식이면 직원을 찾고, 아니면 사업자 로그인 ID로 찾음
 */
export async function login(
  username: string,
  password: string
): Promise<LoginResult> {
  try {
    // 입력 검증
    if (!username || !password) {
      return {
        success: false,
        error: "아이디(이메일)와 비밀번호를 입력해주세요.",
      };
    }

    const supabase = await getSupabaseServerClient();
    const trimmedUsername = username.trim();

    // 1. 먼저 직원 정보 조회 (login_id 또는 email로 검색)
    // 하위 호환성을 위해 login_id와 email 모두 확인
    let employee = null;
    let employeeError = null;

    // 먼저 email로 검색 (가장 확실한 방법)
    // login_id 필드가 없을 수 있으므로 email만 선택
    const { data: employeeByEmail, error: errorByEmail } = await supabase
      .from("employee")
      .select("id, email, password_hash, name, is_active")
      .eq("is_active", true)
      .eq("email", trimmedUsername.toLowerCase())
      .maybeSingle();

    if (employeeByEmail && !errorByEmail) {
      employee = employeeByEmail;
    } else {
      // email로 찾지 못했으므로 에러 설정
      employeeError = errorByEmail;
    }

    if (employee) {
      // 직원 로그인 처리
      const isPasswordValid = await bcrypt.compare(
        password,
        employee.password_hash
      );

      if (!isPasswordValid) {
        return {
          success: false,
          error: "아이디 또는 비밀번호가 올바르지 않습니다.",
        };
      }

      // 직원 세션 생성
      const session = await createSession(employee.id);

      if (!session) {
        return {
          success: false,
          error: "로그인 처리 중 오류가 발생했습니다.",
        };
      }

      redirect("/dashboard");
    }

    // 2. 직원이 아니면 사업자(거래처) 로그인 시도
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("id, login_id, login_password, name, status")
      .eq("login_id", trimmedUsername)
      .eq("status", "approved") // 승인된 사업자만 로그인 가능
      .single();

    if (clientError || !client) {
      return {
        success: false,
        error:
          "아이디 또는 비밀번호가 올바르지 않습니다. 또는 승인 대기 중인 계정입니다.",
      };
    }

    // 사업자 비밀번호 확인 (해시화된 경우와 평문 모두 지원)
    let isPasswordValid = false;

    // bcrypt 해시인지 확인 (해시는 $2a$ 또는 $2b$로 시작)
    if (client.login_password?.startsWith("$2")) {
      isPasswordValid = await bcrypt.compare(password, client.login_password);
    } else {
      // 평문 비밀번호 (기존 데이터 호환성)
      isPasswordValid = password === client.login_password;
    }

    if (!isPasswordValid) {
      return {
        success: false,
        error: "아이디 또는 비밀번호가 올바르지 않습니다.",
      };
    }

    // 사업자 세션 생성
    const { createClientSession } = await import("@/lib/auth");
    const session = await createClientSession(client.id);

    if (!session) {
      return {
        success: false,
        error: "로그인 처리 중 오류가 발생했습니다.",
      };
    }

    // 사업자 로그인 성공 - 사업자용 대시보드로 리다이렉트 (또는 메인 페이지)
    redirect("/dashboard");
  } catch (error) {
    // redirect가 발생한 경우는 그대로 전파
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    console.error("로그인 오류:", error);
    return {
      success: false,
      error: "로그인 처리 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 로그아웃
 */
export async function logout() {
  const { clearSession } = await import("@/lib/auth");
  await clearSession();
  redirect("/login");
}
