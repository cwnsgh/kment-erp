import { ReactNode } from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { getPendingSignupRequests } from '@/app/actions/client-approval';

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  // 세션 확인
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // 승인 대기 건수 가져오기
  const approvalResult = await getPendingSignupRequests();
  const pendingCount = approvalResult.success && approvalResult.data 
    ? approvalResult.data.length 
    : 0;

  return <AppShell session={session} pendingApprovalCount={pendingCount}>{children}</AppShell>;
}



