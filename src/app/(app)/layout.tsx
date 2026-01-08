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
  if (!isEmployeeSession(session)) {
    redirect('/client/dashboard');
  }

  // 승인 대기 건수 가져오기
  const approvalResult = await getPendingSignupRequests();
  const pendingCount = approvalResult.success && approvalResult.data 
    ? approvalResult.data.length 
    : 0;

  // 이 시점에서 session은 EmployeeSession으로 좁혀짐
  return <AppShell session={session} pendingApprovalCount={pendingCount}>{children}</AppShell>;
}



