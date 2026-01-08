import { ReactNode } from 'react';
import { getSession, ClientSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ClientShell } from '@/components/client/client-shell';

type ClientLayoutProps = {
  children: ReactNode;
};

/**
 * 타입 가드: ClientSession인지 확인
 */
function isClientSession(session: any): session is ClientSession {
  return session?.type === 'client';
}

export default async function ClientLayout({ children }: ClientLayoutProps) {
  // 세션 확인
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // ClientSession인지 확인
  if (!isClientSession(session)) {
    // 직원 세션이면 직원 대시보드로 리다이렉트
    redirect('/dashboard');
  }

  return (
    <ClientShell session={session}>
      {children}
    </ClientShell>
  );
}

