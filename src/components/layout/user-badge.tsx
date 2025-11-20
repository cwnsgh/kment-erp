'use client';

import { ChevronDown, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { logout } from '@/app/actions/auth';

interface UserBadgeProps {
  name: string;
  roleName?: string | null;
  email: string;
}

export function UserBadge({ name, roleName, email }: UserBadgeProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-left text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/20 text-sm font-semibold text-white">
          {initial}
        </span>
        <span>
          <span className="block text-sm font-semibold text-white">{name}</span>
          <span className="block text-xs text-white/60">
            {roleName || '직원'} · {email}
          </span>
        </span>
        <ChevronDown size={16} className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-white/10 bg-brand-dark shadow-xl">
          <div className="py-2">
            <div className="px-4 py-2 text-xs text-white/50">
              <div className="font-medium text-white">{name}</div>
              <div className="mt-1">{email}</div>
            </div>
            <div className="my-2 border-t border-white/10" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              <LogOut size={16} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
