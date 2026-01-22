"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { formatBusinessNumber, normalizeBusinessNumber } from "@/lib/business-number";

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

    const normalized = normalizeBusinessNumber(businessNumber);
    if (normalized.length !== 10) {
      return {
        available: false,
        message: "사업자등록번호 형식이 올바르지 않습니다.",
      };
    }

    const isValidBusinessNumber = (value: string) => {
      if (!/^\d{10}$/.test(value)) return false;
      const digits = value.split("").map((char) => Number(char));
      const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
      let sum = 0;
      for (let i = 0; i < weights.length; i += 1) {
        sum += digits[i] * weights[i];
      }
      sum += Math.floor((digits[8] * 5) / 10);
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === digits[9];
    };

    if (!isValidBusinessNumber(normalized)) {
      return {
        available: false,
        message: "유효하지 않은 사업자등록번호입니다.",
      };
    }
    const formatted = formatBusinessNumber(normalized);

    // 국세청 API로 유효성 확인 (내부 API 사용)
    // 체크섬 검증은 이미 통과했으므로, 실제 존재하는 사업자등록번호인지 API로 확인
    // API 검증은 필수입니다 - 실패하면 유효하지 않은 것으로 처리
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    try {
      const verifyResponse = await fetch(`${baseUrl}/api/business/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          businessNumber: normalized,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({
          error: `HTTP ${verifyResponse.status}: ${verifyResponse.statusText}`,
        }));
        return {
          available: false,
          message: errorData.error || "사업자등록번호 유효성 검증에 실패했습니다.",
        };
      }

      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success) {
        return {
          available: false,
          message: verifyResult.error || "사업자등록번호를 확인할 수 없습니다.",
        };
      }
      
      // API 검증 성공 - 실제 존재하는 사업자등록번호임을 확인
    } catch (apiError) {
      console.error("사업자등록번호 API 호출 오류:", apiError);
      // API 호출 실패 시 유효하지 않은 것으로 처리
      return {
        available: false,
        message: "사업자등록번호 유효성 검증 중 오류가 발생했습니다. 올바른 사업자등록번호를 입력해주세요.",
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
