"use client";
import { Bell, LogOut, Menu, User } from "lucide-react";
import Link from "next/link";
import {
  ReactNode,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

import { mainNav, type NavItem } from "@/config/navigation";
import { EmployeeSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import {
  getEmployeeUnreadNotificationCount,
  getEmployeeNotifications,
  markEmployeeNotificationAsRead,
  markAllEmployeeNotificationsAsRead,
  Notification,
} from "@/app/actions/work-request";

import { ComingSoon } from "./coming-soon";
import { NavigationGroup } from "./navigation-group";
import { PasswordChangeModal } from "./password-change-modal";
import styles from "./app-shell.module.css";

type AppShellProps = {
  children: ReactNode;
  session: EmployeeSession;
  pendingApprovalCount?: number;
};

export function AppShell({
  children,
  session,
  pendingApprovalCount = 0,
}: AppShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMini, setSidebarMini] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

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

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);
      const result = await getEmployeeNotifications();
      if (result.success && result.data) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error("직원 알림 조회 오류:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    setNotificationOpen((prev) => !prev);
    await fetchNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      const result = await markEmployeeNotificationAsRead(notification.id);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
        window.dispatchEvent(new CustomEvent("employee-notifications:updated"));
        router.refresh();
      }
    }

    if (notification.work_request_id) {
      router.push(
        `/operations/tasks?workRequestId=${encodeURIComponent(
          notification.work_request_id
        )}`
      );
    }
  };

  const handleAllNotificationsRead = async () => {
    const result = await markAllEmployeeNotificationsAsRead();
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotificationCount(0);
      window.dispatchEvent(new CustomEvent("employee-notifications:updated"));
      router.refresh();
    }
  };

  const formatNotificationDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getEmployeeUnreadNotificationCount();
      if (result.success && result.count !== undefined) {
        setUnreadNotificationCount(result.count);
      }
    } catch (error) {
      console.error("직원 알림 개수 조회 오류:", error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      fetchUnreadCount();
    };

    window.addEventListener(
      "employee-notifications:updated",
      handleNotificationsUpdated
    );
    return () => {
      window.removeEventListener(
        "employee-notifications:updated",
        handleNotificationsUpdated
      );
    };
  }, [fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    }

    if (notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationOpen]);

  // roleId에 따라 메뉴를 필터링하는 함수
  const filterNavByRole = (
    navItems: NavItem[],
    roleId: number | null
  ): NavItem[] => {
    return navItems
      .filter((item) => {
        // allowedRoleIds가 없으면 모든 role 접근 가능
        if (!item.allowedRoleIds || item.allowedRoleIds.length === 0) {
          return true;
        }
        // allowedRoleIds가 있으면 해당 role ID만 허용
        return roleId !== null && item.allowedRoleIds.includes(roleId);
      })
      .map((item) => {
        // 자식 메뉴가 있으면 재귀적으로 필터링
        if (item.children) {
          const filteredChildren = filterNavByRole(item.children, roleId);
          return {
            ...item,
            children:
              filteredChildren.length > 0 ? filteredChildren : undefined,
          };
        }
        return item;
      })
      .filter((item) => {
        // 자식이 있는 메뉴는 자식이 하나라도 남아있어야 표시
        return !item.children || item.children.length > 0;
      });
  };

  // role에 따라 필터링된 메뉴
  const filteredNav = useMemo(
    () => filterNavByRole(mainNav, session.roleId),
    [session.roleId]
  );

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-800">
      {/* 헤더 - 최상단 */}
      <header className="flex h-20 items-center justify-between bg-brand-dark px-8 text-white">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 lg:hidden"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <Menu size={18} />
            <span className="sr-only">메뉴 열기</span>
          </button>
          <button
            type="button"
            className="hidden lg:inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            onClick={() => setSidebarMini((prev) => !prev)}
          >
            <Menu size={18} />
            <span className="sr-only">사이드바 축소</span>
          </button>
          <Link
            href="/dashboard"
            className="text-xl font-semibold tracking-wide text-white"
          >
            KMENT
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <div className={styles.notificationWrap} ref={notificationRef}>
            <button
              type="button"
              className={styles.notificationButton}
              onClick={handleToggleNotifications}
            >
              <Bell size={20} />
              {unreadNotificationCount > 0 && (
                <span className={styles.notificationBadge}>
                  {unreadNotificationCount}
                </span>
              )}
              <span className="sr-only">알림</span>
            </button>
            {notificationOpen && (
              <div className={styles.notifyContainer}>
                <div className={styles.notifyHeader}>
                  <p className={styles.notifyTitle}>알림</p>
                  {unreadNotificationCount > 0 && (
                    <button
                      type="button"
                      className={styles.notifyAllRead}
                      onClick={handleAllNotificationsRead}
                    >
                      모두 읽음
                    </button>
                  )}
                </div>
                <div className={styles.notifyContent}>
                  {notificationLoading ? (
                    <div className={styles.notifyEmpty}>
                      알림을 불러오는 중...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className={styles.notifyEmpty}>알림이 없습니다.</div>
                  ) : (
                    <div className={styles.notifyArea}>
                      {notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          className={`${styles.notifyItem} ${
                            !notification.is_read ? styles.notifyUnread : ""
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className={styles.notifyTop}>
                            <p>{notification.title || "알림"}</p>
                            {!notification.is_read && (
                              <span className={styles.notifyDot} />
                            )}
                          </div>
                          <div className={styles.notifyMid}>
                            <p>{notification.message}</p>
                          </div>
                          <div className={styles.notifyBot}>
                            {formatNotificationDate(notification.created_at)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="text-sm text-white">
            {new Date().toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              weekday: "short",
            })}
          </div>
          <div className="text-sm font-medium text-white">{session.name}님</div>
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            >
              <span className="text-sm font-semibold">
                {session.name.charAt(0).toUpperCase()}
              </span>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white shadow-xl">
                <div className="p-4">
                  {/* 사용자 정보 */}
                  <div className="flex items-center gap-3 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {session.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {session.roleName || "관리자"}
                      </div>
                    </div>
                  </div>

                  {/* 구분선 */}
                  <div className="my-2 border-t border-slate-200" />

                  {/* 메뉴 항목 */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setPasswordModalOpen(true);
                      }}
                    >
                      개인정보 수정
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      월차 신청 조회
                    </button>
                  </div>

                  {/* 구분선 */}
                  <div className="my-2 border-t border-slate-200" />

                  {/* 로그아웃 */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-blue-600 transition hover:bg-blue-50"
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
      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 */}
        <aside
          className={[
            styles.sidebar,
            sidebarMini && styles.sidebarMini,
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <nav className={styles.sidebarNav}>
            <ul className={styles.menuList}>
              {filteredNav.map((group) => {
                // 회원가입 승인 관리 메뉴에 뱃지 숫자 전달
                const item =
                  group.label === "관리자 페이지" && group.children
                    ? {
                        ...group,
                        children: group.children.map((child) => {
                          if (child.href === "/staff/approvals") {
                            return { ...child, badge: pendingApprovalCount };
                          }
                          return child;
                        }),
                      }
                    : group;

                return (
                  <NavigationGroup
                    key={group.label}
                    item={item}
                    isMini={sidebarMini}
                    onNavigate={() => setSidebarOpen(false)}
                  />
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-white px-6 py-10 lg:px-12">
            <div className="mx-auto w-full max-w-6xl space-y-10">
              {children}
            </div>
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
      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
}
