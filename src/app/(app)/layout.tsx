import { ReactNode } from 'react';
import { getSession, EmployeeSession, ClientSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { getPendingSignupRequests } from '@/app/actions/client-approval';

type AppLayoutProps = {
  children: ReactNode;
};

/**
 * 타입 가드: EmployeeSession인지 확인
 */
function isEmployeeSession(session: EmployeeSession | ClientSession): session is EmployeeSession {
  return session.type === 'employee';
}

export default async function AppLayout({ children }: AppLayoutProps) {
  // 세션 확인
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // ClientSession인 경우 거래처용 레이아웃으로 리다이렉트
  // TODO: 거래처용 레이아웃 생성 후 리다이렉트 경로 변경 필요
  if (!isEmployeeSession(session)) {
    // 임시로 로그인 페이지로 리다이렉트
    // 나중에 거래처용 레이아웃이 생성되면 해당 경로로 변경 (예: '/client/dashboard')
    redirect('/login');
  }

  // 승인 대기 건수 가져오기
  const approvalResult = await getPendingSignupRequests();
  const pendingCount = approvalResult.success && approvalResult.data 
    ? approvalResult.data.length 
    : 0;

  // 이 시점에서 session은 EmployeeSession으로 좁혀짐
  return <AppShell session={session} pendingApprovalCount={pendingCount}>{children}</AppShell>;
}



