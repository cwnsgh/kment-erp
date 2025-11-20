'use client';

import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  LayoutDashboard,
  LucideIcon,
  Plane,
  Users,
  Workflow
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import type { NavItem } from '@/config/navigation';

type NavigationGroupProps = {
  item: NavItem;
  onNavigate?: () => void;
};

export function NavigationGroup({ item, onNavigate }: NavigationGroupProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(item.children?.some((child) => pathname === child.href) ?? false);

  const isActive = pathname === item.href || item.children?.some((child) => pathname === child.href);

  if (!item.children || item.children.length === 0) {
    return (
      <Link
        href={item.href}
        className={[
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent-soft text-accent shadow-sm'
            : 'text-slate-700 hover:bg-slate-200'
        ].join(' ')}
        onClick={onNavigate}
      >
        <NavIcon icon={item.icon} isActive={isActive} />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent-soft text-accent shadow-sm'
            : 'text-slate-700 hover:bg-slate-200'
        ].join(' ')}
      >
        <span className="inline-flex items-center gap-3">
          <NavIcon icon={item.icon} isActive={isActive} />
          {item.label}
        </span>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>
      {open && (
        <div className="space-y-1 pl-9">
          {item.children.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={[
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  childActive
                    ? 'bg-accent-soft text-accent font-medium'
                    : 'text-slate-600 hover:bg-slate-200'
                ].join(' ')}
                onClick={onNavigate}
              >
                • {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavIcon({ icon, isActive }: { icon?: string; isActive?: boolean }) {
  if (!icon) return <span className="inline-flex h-2 w-2 rounded-full bg-slate-300" />;

  const Icon = iconMap[icon] ?? iconMap['layout-dashboard'];
  return <Icon size={18} className={isActive ? 'text-accent' : 'text-slate-500'} />;
}

const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'building-2': Building2,
  'file-text': FileText,
  workflow: Workflow,
  calendar: Calendar,
  users: Users,
  plane: Plane
};

