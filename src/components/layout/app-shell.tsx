'use client';
import { Bell, Menu } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useState } from 'react';

import { mainNav } from '@/config/navigation';
import { EmployeeSession } from '@/lib/auth';

import { ComingSoon } from './coming-soon';
import { NavigationGroup } from './navigation-group';
import { UserBadge } from './user-badge';

type AppShellProps = {
  children: ReactNode;
  session: EmployeeSession;
};

export function AppShell({ children, session }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-800">
      {/* 헤더 - 최상단 */}
      <header className="flex h-20 items-center justify-between bg-brand-dark px-8 text-white">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <Menu size={18} />
            <span className="sr-only">메뉴 열기</span>
          </button>
          <Link href="/dashboard" className="text-xl font-semibold tracking-wide text-white">
            KMENT
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          >
            <Bell size={20} />
            <span className="sr-only">알림</span>
          </button>
          <div className="text-sm text-white">
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              weekday: 'short'
            })}
          </div>
          <div className="text-sm font-medium text-white">
            {session.name}님
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
          >
            <span className="text-sm font-semibold">{session.name.charAt(0).toUpperCase()}</span>
          </button>
        </div>
      </header>

      {/* 중간 영역 - 사이드바와 메인 컨텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 */}
        <aside
          className={[
            'flex w-72 flex-col border-r border-slate-200 bg-slate-100 text-slate-700 shadow-sm transition-transform duration-200',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          ].join(' ')}
        >
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
            {mainNav.map((group) => (
              <NavigationGroup key={group.label} item={group} onNavigate={() => setSidebarOpen(false)} />
            ))}
          </nav>
        </aside>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-white px-6 py-10 lg:px-12">
            <div className="mx-auto w-full max-w-6xl space-y-10">{children}</div>
          </main>
        </div>
      </div>

      {/* 푸터 - 최하단 */}
      <footer className="bg-brand-dark px-6 py-5 text-xs text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <p>© {new Date().getFullYear()} KMENT Corp.</p>
        </div>
      </footer>

      <ComingSoon feature="모바일 사이드바" hidden />
    </div>
  );
}

