import { cookies } from 'next/headers';
import { getSupabaseServerClient } from './supabase-server';

export interface EmployeeSession {
  id: string;
  email: string;
  name: string;
  roleId: number | null;
  roleLevel: number | null;
  roleName: string | null;
  type: 'employee';
}

export interface ClientSession {
  id: string;
  loginId: string;
  name: string;
  type: 'client';
}

const EMPLOYEE_SESSION_COOKIE = 'employee_session';
const CLIENT_SESSION_COOKIE = 'client_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7일

/**
 * 세션 생성 (로그인 시 사용)
 */
export async function createSession(employeeId: string) {
  const supabase = await getSupabaseServerClient();
  
  // 직원 정보와 역할 정보 조회
  const { data: employee, error } = await supabase
    .from('employee')
    .select(`
      id,
      email,
      name,
      role_id,
      is_active,
      role:role_id (
        id,
        level,
        name
      )
    `)
    .eq('id', employeeId)
    .eq('is_active', true)
    .single();

  if (error || !employee) {
    return null;
  }

  const session: EmployeeSession = {
    id: employee.id,
    email: employee.email,
    name: employee.name,
    roleId: employee.role_id,
    roleLevel: employee.role?.level || null,
    roleName: employee.role?.name || null,
    type: 'employee',
  };

  // 쿠키에 세션 저장
  const cookieStore = await cookies();
  cookieStore.set(EMPLOYEE_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return session;
}

/**
 * 사업자(거래처) 세션 생성
 */
export async function createClientSession(clientId: string) {
  const supabase = await getSupabaseServerClient();
  
  // 거래처 정보 조회
  const { data: client, error } = await supabase
    .from('client')
    .select('id, login_id, name, status')
    .eq('id', clientId)
    .eq('status', 'approved')
    .single();

  if (error || !client) {
    return null;
  }

  const session: ClientSession = {
    id: client.id,
    loginId: client.login_id || '',
    name: client.name,
    type: 'client',
  };

  // 쿠키에 세션 저장
  const cookieStore = await cookies();
  cookieStore.set(CLIENT_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return session;
}

/**
 * 현재 세션 가져오기 (직원 또는 사업자)
 */
export async function getSession(): Promise<EmployeeSession | ClientSession | null> {
  const cookieStore = await cookies();
  
  // 직원 세션 확인
  const employeeSessionCookie = cookieStore.get(EMPLOYEE_SESSION_COOKIE);

  if (employeeSessionCookie) {
    try {
      const session: EmployeeSession = JSON.parse(employeeSessionCookie.value);
      
      // 세션 유효성 검증 (DB에서 확인)
      const supabase = await getSupabaseServerClient();
      const { data: employee, error } = await supabase
        .from('employee')
        .select('id, is_active')
        .eq('id', session.id)
        .eq('is_active', true)
        .single();

      if (error || !employee) {
        await clearSession();
        return null;
      }

      return session;
    } catch (error) {
      return null;
    }
  }

  // 사업자 세션 확인
  const clientSessionCookie = cookieStore.get(CLIENT_SESSION_COOKIE);
  if (clientSessionCookie) {
    try {
      const session: ClientSession = JSON.parse(clientSessionCookie.value);
      
      // 세션 유효성 검증 (DB에서 확인)
      const supabase = await getSupabaseServerClient();
      const { data: client, error } = await supabase
        .from('client')
        .select('id, status')
        .eq('id', session.id)
        .eq('status', 'approved')
        .single();

      if (error || !client) {
        await clearClientSession();
        return null;
      }

      return session;
    } catch (error) {
      return null;
    }
  }

  return null;
}

/**
 * 세션 삭제 (로그아웃 시 사용)
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(EMPLOYEE_SESSION_COOKIE);
  cookieStore.delete(CLIENT_SESSION_COOKIE);
}

/**
 * 사업자 세션 삭제
 */
export async function clearClientSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CLIENT_SESSION_COOKIE);
}

/**
 * 인증 확인 (미들웨어에서 사용)
 */
export async function requireAuth(): Promise<EmployeeSession> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('인증이 필요합니다.');
  }

  return session;
}

