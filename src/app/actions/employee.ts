"use server";

import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    // 세션 확인
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    // 비밀번호 확인
    if (data.newPassword !== data.confirmPassword) {
      return {
        success: false,
        error: "새 비밀번호가 일치하지 않습니다.",
      };
    }

    // 비밀번호 길이 확인
    if (data.newPassword.length < 6) {
      return {
        success: false,
        error: "새 비밀번호는 최소 6자 이상이어야 합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    // 현재 비밀번호 확인
    const { data: employee, error: fetchError } = await supabase
      .from("employee")
      .select("password_hash")
      .eq("id", session.id)
      .eq("is_active", true)
      .single();

    if (fetchError || !employee) {
      return {
        success: false,
        error: "직원 정보를 찾을 수 없습니다.",
      };
    }

    // 현재 비밀번호 검증
    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      employee.password_hash
    );

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: "현재 비밀번호가 올바르지 않습니다.",
      };
    }

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // 비밀번호 업데이트
    const { error: updateError } = await supabase
      .from("employee")
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (updateError) {
      return {
        success: false,
        error: "비밀번호 변경에 실패했습니다.",
      };
    }

    return {
      success: true,
      message: "비밀번호가 성공적으로 변경되었습니다.",
    };
  } catch (error) {
    console.error("비밀번호 변경 오류:", error);
    return {
      success: false,
      error: "비밀번호 변경 중 오류가 발생했습니다.",
    };
  }
}




