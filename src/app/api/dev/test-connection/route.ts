import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * ============================================
 * 개발/디버깅 API: Supabase 연결 테스트
 * ============================================
 * 
 * Supabase 데이터베이스 연결 상태를 확인하는 개발용 API입니다.
 * 프로덕션 환경에서는 보안을 위해 비활성화하거나 인증을 추가해야 합니다.
 * 
 * @route GET /api/dev/test-connection
 * @returns {Object} 연결 상태 및 결과
 * 
 * @example
 * GET /api/dev/test-connection
 * Response: {
 *   success: true,
 *   message: "Supabase 연결 성공!",
 *   data: [...]
 * }
 */
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();

    // 간단한 쿼리로 연결 테스트
    const { data, error } = await supabase
      .from("client")
      .select("count")
      .limit(1);

    if (error) {
      // 테이블이 없어도 연결은 성공한 것
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          message: "Supabase 연결 성공! (테이블은 아직 생성되지 않았습니다)",
          error: error.message,
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Supabase 연결 성공!",
      data: data,
    });
  } catch (error) {
    console.error("Supabase 연결 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Supabase 연결 실패",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}





