'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import type { NavItem } from '@/config/navigation';
import styles from './app-shell.module.css';

type NavigationGroupProps = {
  item: NavItem;
  isMini?: boolean;
  onNavigate?: () => void;
};

// 아이콘 매핑 (ERP 완성본 이미지 파일명)
const iconMap: Record<string, { normal: string; active: string }> = {
  'layout-dashboard': { normal: '/images/home_icon.svg', active: '/images/home_icon_c.svg' },
  'building-2': { normal: '/images/building_icon.svg', active: '/images/building_icon_c.svg' },
  'file-text': { normal: '/images/bag_icon.svg', active: '/images/bag_icon_c.svg' },
  workflow: { normal: '/images/gear_icon.svg', active: '/images/gear_icon_c.svg' },
  calendar: { normal: '/images/clock_icon.svg', active: '/images/clock_icon_c.svg' }, // 일정 관리
  users: { normal: '/images/users_icon.svg', active: '/images/users_icon_c.svg' },
  plane: { normal: '/images/calendar_icon.svg', active: '/images/calendar_icon_c.svg' }, // 연차 관리
  phone: { normal: '/images/phone_icon.svg', active: '/images/phone_icon_c.svg' },
  lock: { normal: '/images/lock_icon.svg', active: '/images/lock_icon_c.svg' },
};

// 미니 사이드바용 텍스트 변환 함수
function getMiniText(label: string): string {
  // 특수 케이스: 관리자 페이지 -> 관리자
  if (label === '관리자 페이지') {
    return '관리자';
  }
  // 일반 케이스: 띄어쓰기 제거
  return label.replace(/\s+/g, '');
}

export function NavigationGroup({ item, isMini = false, onNavigate }: NavigationGroupProps) {
  const pathname = usePathname();
  
  // 서브메뉴 열림 상태 계산 (현재 경로가 서브메뉴 중 하나와 일치할 때만)
  const hasActiveChild = 
    item.children?.some((child) => 
      pathname === child.href || 
      child.children?.some((grandchild) => pathname === grandchild.href)
    ) ?? false;

  const [open, setOpen] = useState(hasActiveChild);

  // pathname이 변경될 때마다 open 상태 업데이트
  // - 현재 경로가 이 메뉴의 서브메뉴 중 하나와 일치하면 열림
  // - 그렇지 않으면 자동으로 닫힘 (다른 페이지로 이동했을 때)
  useEffect(() => {
    setOpen(hasActiveChild);
  }, [pathname, hasActiveChild]);

  // 메인 메뉴는 정확히 그 페이지일 때만 활성화 (서브메뉴가 열렸다고 활성화되면 안됨)
  const isActive = pathname === item.href;
  
  const hasSub = item.children && item.children.length > 0;
  const iconPaths = item.icon ? iconMap[item.icon] : null;
  
  // 미니 사이드바일 때는 서브메뉴가 있어도 단순 링크로 표시
  if (isMini && hasSub) {
    return (
      <li className={`${styles.menuItem} ${isActive ? styles.active : ''}`}>
        <Link href={item.href} onClick={onNavigate}>
          {iconPaths && (
            <span className={styles.icon}>
              <Image
                src={iconPaths.normal}
                alt=""
                className="iconB"
                width={20}
                height={20}
              />
              <Image
                src={iconPaths.active}
                alt=""
                className="iconC"
                width={20}
                height={20}
              />
            </span>
          )}
          <span className={styles.menuText}>{getMiniText(item.label)}</span>
        </Link>
      </li>
    );
  }

  // 서브메뉴가 없는 단일 메뉴
  if (!hasSub) {
    return (
      <li className={`${styles.menuItem} ${isActive ? styles.active : ''}`}>
        <Link href={item.href} onClick={onNavigate}>
          {iconPaths && (
            <span className={styles.icon}>
              <Image
                src={iconPaths.normal}
                alt=""
                className="iconB"
                width={20}
                height={20}
              />
              <Image
                src={iconPaths.active}
                alt=""
                className="iconC"
                width={20}
                height={20}
              />
            </span>
          )}
          <span className={styles.menuText}>
            {isMini ? getMiniText(item.label) : item.label}
          </span>
        </Link>
      </li>
    );
  }

  // 서브메뉴가 있는 메뉴
  // 주의: 메인 메뉴 버튼은 활성화되지 않음 (isActive 사용 안 함)
  // 실제 활성화는 서브메뉴 항목에서만 처리
  return (
    <li className={`${styles.menuItem} ${styles.hasSub} ${open ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div>
          {iconPaths && (
            <span className={styles.icon}>
              <Image
                src={iconPaths.normal}
                alt=""
                className="iconB"
                width={20}
                height={20}
              />
              <Image
                src={iconPaths.active}
                alt=""
                className="iconC"
                width={20}
                height={20}
              />
            </span>
          )}
          <span className={styles.menuText}>{item.label}</span>
        </div>
        <span className={styles.arrow}>
          <Image src="/images/arrow_icon.svg" alt="" width={12} height={12} />
        </span>
      </button>

      {!isMini && (
        <ul className={styles.submenu}>
          {item.children?.map((child) => {
            // 서브메뉴 항목 활성화: 정확히 그 경로일 때만
            const childActive = pathname === child.href;
            const hasGrandchildren = child.children && child.children.length > 0;
            
            return (
              <li key={child.href} className={childActive ? styles.active : ''}>
                {hasGrandchildren && child.children ? (
                  <>
                    <Link href={child.href} onClick={onNavigate}>
                      {child.label}
                    </Link>
                    <ul className={styles.subdepth2}>
                      {child.children.map((grandchild) => {
                        const grandchildActive = pathname === grandchild.href;
                        return (
                          <li key={grandchild.href} className={grandchildActive ? styles.active : ''}>
                            <Link 
                              href={grandchild.href} 
                              onClick={onNavigate}
                            >
                              {grandchild.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <Link href={child.href} onClick={onNavigate} style={{ position: 'relative' }}>
                    {child.label}
                    {child.badge !== undefined && child.badge > 0 ? (
                      <span className={styles.arlam}>{child.badge}</span>
                    ) : null}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
