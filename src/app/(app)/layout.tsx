import { ReactNode } from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  // 세션 확인
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  return <AppShell session={session}>{children}</AppShell>;
}



