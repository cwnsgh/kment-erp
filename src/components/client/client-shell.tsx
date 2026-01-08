"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, User, LogOut } from "lucide-react";
import { ClientSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import {
  getPendingWorkRequestsByClientId,
  getClientUnreadNotificationCount,
} from "@/app/actions/work-request";
import { ClientPasswordChangeModal } from "@/components/client/client-password-change-modal";
import styles from "./client-shell.module.css";

type ClientShellProps = {
  children: ReactNode;
  session: ClientSession;
};

export function ClientShell({ children, session }: ClientShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMini, setSidebarMini] = useState(false);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // 승인 대기 건수 조회
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const result = await getPendingWorkRequestsByClientId(session.id);
        if (result.success && result.data) {
          const pending = result.data.filter(
            (r) => r.status === "pending"
          ).length;
          setPendingApprovalCount(pending);
        }
      } catch (error) {
        console.error("승인 대기 건수 조회 오류:", error);
      }
    };

    fetchPendingCount();
  }, [session.id]);

  // 읽지 않은 알림 개수 조회
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const result = await getClientUnreadNotificationCount();
        if (result.success && result.count !== undefined) {
          setUnreadNotificationCount(result.count);
        }
      } catch (error) {
        console.error("읽지 않은 알림 개수 조회 오류:", error);
      }
    };

    fetchUnreadCount();
    // 주기적으로 업데이트 (30초마다)
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // 프로필 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
  };

  return (
    <div className={styles.clientLayout}>
      {/* 헤더 - 최상단 */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <Menu size={18} />
            <span className="sr-only">메뉴 열기</span>
          </button>
          <button
            type="button"
            className={styles.menuToggleMini}
            onClick={() => setSidebarMini((prev) => !prev)}
          >
            <Menu size={18} />
            <span className="sr-only">사이드바 축소</span>
          </button>
          <Link href="/client/dashboard" className={styles.logo}>
            KMENT
          </Link>
        </div>
        <div className={styles.headerRight}>
          <Link
            href="/client/notifications"
            className={styles.notificationButton}
          >
            <Bell size={20} />
            {unreadNotificationCount > 0 && (
              <span className={styles.notificationBadge}>
                {unreadNotificationCount}
              </span>
            )}
            <span className="sr-only">알림</span>
          </Link>
          <div className={styles.dateText}>{formatDate()}</div>
          <div className={styles.userName}>{session.name}님</div>
          <div className={styles.profileMenu} ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className={styles.profileButton}
            >
              <span className={styles.profileInitial}>
                {session.name.charAt(0).toUpperCase()}
              </span>
            </button>

            {profileMenuOpen && (
              <div className={styles.profileDropdown}>
                <div className={styles.profileDropdownContent}>
                  {/* 사용자 정보 */}
                  <div className={styles.profileInfo}>
                    <div className={styles.profileAvatar}>
                      <User size={20} />
                    </div>
                    <div>
                      <div className={styles.profileName}>{session.name}</div>
                      <div className={styles.profileRole}>클라이언트</div>
                    </div>
                  </div>

                  {/* 구분선 */}
                  <div className={styles.profileDivider} />

                  {/* 메뉴 항목 */}
                  <div className={styles.profileMenuItems}>
                    <button
                      type="button"
                      className={styles.profileMenuItem}
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setPasswordModalOpen(true);
                      }}
                    >
                      개인정보 수정
                    </button>
                  </div>

                  {/* 구분선 */}
                  <div className={styles.profileDivider} />

                  {/* 로그아웃 */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={styles.profileLogoutButton}
                  >
                    <LogOut size={16} />
                    <span>로그아웃</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 중간 영역 - 사이드바와 메인 컨텐츠 */}
      <div className={styles.mainContainer}>
        {/* 사이드바 */}
        <aside
          className={`${styles.sidebar} ${
            sidebarMini ? styles.sidebarMini : ""
          } ${sidebarOpen ? styles.sidebarOpen : ""}`}
        >
          <nav className={styles.sidebarNav}>
            <ul className={styles.menuList}>
              <li
                className={`${styles.menuItem} ${
                  pathname === "/client/dashboard" ? styles.active : ""
                }`}
              >
                <Link
                  href="/client/dashboard"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={styles.icon}>
                    <Image
                      src="/images/home_icon.svg"
                      alt=""
                      width={20}
                      height={20}
                      className={styles.iconB}
                      style={{
                        width: "20px",
                        height: "20px",
                        maxWidth: "20px",
                        maxHeight: "20px",
                      }}
                    />
                    <Image
                      src="/images/home_icon_c.svg"
                      alt=""
                      width={20}
                      height={20}
                      className={styles.iconC}
                      style={{
                        width: "20px",
                        height: "20px",
                        maxWidth: "20px",
                        maxHeight: "20px",
                      }}
                    />
                  </span>
                  <span className={styles.menuText}>대시보드</span>
                </Link>
              </li>
              <li
                className={`${styles.menuItem} ${
                  pathname === "/client/approvals" ? styles.active : ""
                }`}
              >
                <Link
                  href="/client/approvals"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={styles.icon}>
                    <Image
                      src="/images/check_round_icon.svg"
                      alt=""
                      width={20}
                      height={20}
                      className={styles.iconB}
                      style={{
                        width: "20px",
                        height: "20px",
                        maxWidth: "20px",
                        maxHeight: "20px",
                      }}
                    />
                    <Image
                      src="/images/check_round_icon_c.svg"
                      alt=""
                      width={20}
                      height={20}
                      className={styles.iconC}
                      style={{
                        width: "20px",
                        height: "20px",
                        maxWidth: "20px",
                        maxHeight: "20px",
                      }}
                    />
                  </span>
                  <span className={styles.menuText}>승인 현황</span>
                  {pendingApprovalCount > 0 && (
                    <span className={styles.arlam}>{pendingApprovalCount}</span>
                  )}
                </Link>
              </li>
              <li
                className={`${styles.menuItem} ${
                  pathname === "/client/tasks" ? styles.active : ""
                }`}
              >
                <Link
                  href="/client/tasks"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={styles.icon}>
                    <Image
                      src="/images/graph_icon.svg"
                      alt=""
                      width={20}
                      height={20}
                      className={styles.iconB}
                      style={{
                        width: "20px",
                        height: "20px",
                        maxWidth: "20px",
                        maxHeight: "20px",
                      }}
                    />
                    <Image
                      src="/images/graph_icon_c.svg"
                      alt=""
                      width={20}
                      height={20}
                      className={styles.iconC}
                      style={{
                        width: "20px",
                        height: "20px",
                        maxWidth: "20px",
                        maxHeight: "20px",
                      }}
                    />
                  </span>
                  <span className={styles.menuText}>작업 현황</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* 메인 컨텐츠 영역 */}
        <div
          className={styles.contentArea}
          style={{ marginLeft: sidebarMini ? "90px" : "280px" }}
        >
          <main className={styles.mainContent}>
            <div className={styles.contentInner}>{children}</div>
          </main>
        </div>
      </div>

      {/* 푸터 - 최하단 */}
      <footer
        className={styles.footer}
        style={{ marginLeft: sidebarMini ? "90px" : "280px" }}
      >
        <div className={styles.footerInner}>
          <p>© {new Date().getFullYear()} KMENT Corp.</p>
        </div>
      </footer>

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* 비밀번호 변경 모달 */}
      <ClientPasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        clientId={session.id}
      />
    </div>
  );
}
