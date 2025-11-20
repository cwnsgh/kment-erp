import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth';

/**
 * 보호된 경로 목록
 */
const protectedPaths = ['/dashboard', '/clients', '/contracts', '/operations', '/schedule', '/staff', '/vacations'];

/**
 * 인증이 필요 없는 경로 목록
 */
const publicPaths = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 보호된 경로인지 확인
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isPublicPath = publicPaths.some(path => pathname === path);

  // 보호된 경로 접근 시
  if (isProtectedPath) {
    try {
      // 세션 확인 (쿠키에서)
      const sessionCookie = request.cookies.get('employee_session');
      
      if (!sessionCookie) {
        // 세션 없음 - 로그인 페이지로 리다이렉트
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 세션 유효성 검증은 각 페이지에서 수행
      return NextResponse.next();
    } catch (error) {
      // 오류 발생 시 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 공개 경로이면서 로그인 상태인 경우
  if (isPublicPath && pathname === '/login') {
    const sessionCookie = request.cookies.get('employee_session');
    
    if (sessionCookie) {
      // 이미 로그인 상태 - 대시보드로 리다이렉트
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};





