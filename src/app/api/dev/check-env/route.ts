import { NextResponse } from "next/server";

/**
 * ============================================
 * 개발/디버깅 API: 환경 변수 확인
 * ============================================
 * 
 * Supabase 환경 변수 설정 상태를 확인하는 개발용 API입니다.
 * 프로덕션 환경에서는 보안을 위해 비활성화하거나 인증을 추가해야 합니다.
 * 
 * @route GET /api/dev/check-env
 * @returns {Object} 환경 변수 설정 상태
 * 
 * @example
 * GET /api/dev/check-env
 * Response: {
 *   hasUrl: true,
 *   hasKey: true,
 *   urlLength: 50,
 *   keyLength: 100,
 *   urlPreview: "https://xxx.supabase...",
 *   message: "✅ 환경 변수가 설정되었습니다!"
 * }
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseKey?.length || 0,
    urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "없음",
    // 실제 키는 보안상 표시하지 않음
    message:
      supabaseUrl && supabaseKey
        ? "✅ 환경 변수가 설정되었습니다!"
        : "❌ 환경 변수가 설정되지 않았습니다.",
  });
}






