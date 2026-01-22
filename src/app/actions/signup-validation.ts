"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { formatBusinessNumber, normalizeBusinessNumber } from "@/lib/business-number";

function resolveBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * 사업자등록번호 중복 확인
 */
export async function checkBusinessNumber(businessNumber: string): Promise<{
  available: boolean;
  message?: string;
}> {
  if (!businessNumber || businessNumber.trim() === "") {
    return {
      available: false,
      message: "사업자등록번호를 입력해주세요.",
    };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const baseUrl = resolveBaseUrl();

    const normalized = normalizeBusinessNumber(businessNumber);
    if (normalized.length !== 10) {
      return {
        available: false,
        message: "사업자등록번호 형식이 올바르지 않습니다.",
      };
    }
    const formatted = formatBusinessNumber(normalized);

    // 국세청 API로 유효성 확인
    const verifyResponse = await fetch(`${baseUrl}/api/business/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessNumber: normalized,
      }),
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json().catch(() => ({}));
      return {
        available: false,
        message:
          errorData.error || "사업자등록번호 유효성 검증에 실패했습니다.",
      };
    }

    const verifyResult = await verifyResponse.json();
    if (!verifyResult.success) {
      return {
        available: false,
        message: verifyResult.error || "유효하지 않은 사업자등록번호입니다.",
      };
    }
    const candidates = Array.from(
      new Set([businessNumber.trim(), normalized, formatted])
    );
    const orConditions = candidates
      .map((value) => `business_registration_number.eq.${value}`)
      .join(",");

    const { data, error } = await supabase
      .from("client")
      .select("id, business_registration_number, name")
      .or(orConditions)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          available: false,
          message: "이미 등록된 사업자등록번호입니다.",
        };
      }
      console.error("사업자등록번호 확인 오류:", error);
      return {
        available: false,
        message: "확인 중 오류가 발생했습니다.",
      };
    }

    if (data) {
      return {
        available: false,
        message: `이미 등록된 사업자등록번호입니다. (${data.name})`,
      };
    }

    return {
      available: true,
      message: "사용 가능한 사업자등록번호입니다.",
    };
  } catch (error) {
    console.error("사업자등록번호 확인 오류:", error);
    return {
      available: false,
      message: "확인 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 아이디(로그인 ID) 중복 확인
 */
export async function checkUsername(username: string): Promise<{
  available: boolean;
  message?: string;
}> {
  if (!username || username.trim() === "") {
    return {
      available: false,
      message: "아이디를 입력해주세요.",
    };
  }

  // 아이디 형식 검증 (영문, 숫자, 언더스코어, 하이픈만 허용, 3-20자)
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  if (!usernameRegex.test(username.trim())) {
    return {
      available: false,
      message: "아이디는 3-20자의 영문, 숫자, _, - 만 사용 가능합니다.",
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    // 1. 사업자(거래처) 테이블에서 확인
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("id, login_id, name")
      .eq("login_id", username.trim())
      .maybeSingle();

    if (clientError) {
      // PGRST116: 여러 행이 반환된 경우 (중복 데이터) - 아이디 사용 불가
      if (clientError.code === "PGRST116") {
        return {
          available: false,
          message: `이미 사용 중인 아이디입니다.`,
        };
      }
      console.error("아이디 확인 오류 (client):", clientError);
      return {
        available: false,
        message: "확인 중 오류가 발생했습니다.",
      };
    }

    if (client) {
      return {
        available: false,
        message: `이미 사용 중인 아이디입니다.`,
      };
    }

    // 2. 직원 테이블에서도 확인 (email과 중복 방지)
    // login_id 필드가 없을 수 있으므로 email만 확인
    const trimmedUsername = username.trim();

    // email로 확인 (직원은 이메일로 로그인하므로 아이디와 이메일 중복 방지)
    const { data: employeeByEmail, error: errorByEmail } = await supabase
      .from("employee")
      .select("id, email, name")
      .eq("email", trimmedUsername.toLowerCase())
      .maybeSingle();

    if (errorByEmail) {
      // 에러가 발생했지만 데이터가 없는 경우(PGRST116)는 계속 진행
      if (errorByEmail.code !== "PGRST116") {
        console.error("아이디 확인 오류 (employee):", errorByEmail);
        return {
          available: false,
          message: "확인 중 오류가 발생했습니다.",
        };
      }
    }

    if (employeeByEmail) {
      return {
        available: false,
        message: `이미 사용 중인 이메일입니다.`,
      };
    }

    return {
      available: true,
      message: "사용 가능한 아이디입니다.",
    };
  } catch (error) {
    console.error("아이디 확인 오류:", error);
    return {
      available: false,
      message: "확인 중 오류가 발생했습니다.",
    };
  }
}
