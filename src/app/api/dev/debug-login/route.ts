import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

/**
 * ============================================
 * 개발/디버깅 API: 로그인 디버깅
 * ============================================
 * 
 * 로그인 문제 진단 및 계정 확인을 위한 개발용 API입니다.
 * 프로덕션 환경에서는 보안을 위해 비활성화하거나 인증을 추가해야 합니다.
 * 
 * @route GET /api/dev/debug-login?username=admin@kment.co.kr
 * @param {string} username - 검색할 사용자명 (이메일 또는 아이디)
 * @returns {Object} 계정 검색 결과 및 비밀번호 검증 결과
 * 
 * @example
 * GET /api/dev/debug-login?username=admin@kment.co.kr
 * Response: {
 *   success: true,
 *   searchUsername: "admin@kment.co.kr",
 *   byEmail: { found: true, data: {...} },
 *   byLoginId: { found: false, data: null },
 *   allEmployees: [...],
 *   passwordTest: { hash: "...", testResult: true }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username') || 'admin@kment.co.kr';

    const supabase = await getSupabaseServerClient();
    const trimmedUsername = username.trim();

    // 1. email로 검색 (login_id 필드가 없을 수 있으므로 email만 선택)
    const { data: employeeByEmail, error: errorByEmail } = await supabase
      .from('employee')
      .select('id, email, password_hash, name, is_active')
      .eq('is_active', true)
      .eq('email', trimmedUsername.toLowerCase())
      .maybeSingle();

    // 2. login_id로 검색 (필드가 있을 경우만)
    let employeeByLoginId = null;
    let errorByLoginId = null;
    try {
      const result = await supabase
        .from('employee')
        .select('id, email, password_hash, name, is_active')
        .eq('is_active', true)
        .eq('login_id', trimmedUsername)
        .maybeSingle();
      employeeByLoginId = result.data;
      errorByLoginId = result.error;
    } catch (err) {
      // login_id 필드가 없으면 에러 무시
      errorByLoginId = { message: 'login_id 필드가 없습니다' };
    }

    // 3. 모든 직원 조회
    const { data: allEmployees, error: allError } = await supabase
      .from('employee')
      .select('id, email, name, is_active')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      searchUsername: trimmedUsername,
      byLoginId: {
        found: !!employeeByLoginId,
        data: employeeByLoginId ? {
          id: employeeByLoginId.id,
          email: employeeByLoginId.email,
          name: employeeByLoginId.name,
          hasPassword: !!employeeByLoginId.password_hash,
        } : null,
        error: errorByLoginId?.message,
      },
      byEmail: {
        found: !!employeeByEmail,
        data: employeeByEmail ? {
          id: employeeByEmail.id,
          email: employeeByEmail.email,
          name: employeeByEmail.name,
          hasPassword: !!employeeByEmail.password_hash,
        } : null,
        error: errorByEmail?.message,
      },
      allEmployees: allEmployees || [],
      passwordTest: employeeByEmail ? {
        hash: employeeByEmail.password_hash?.substring(0, 20) + '...',
        testResult: await bcrypt.compare('admin123', employeeByEmail.password_hash || ''),
      } : null,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }, { status: 500 });
  }
}






