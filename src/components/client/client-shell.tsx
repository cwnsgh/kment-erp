"use client";

import { ReactNode, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, User, LogOut } from "lucide-react";
import { ClientSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import {
  getPendingWorkRequestsByClientId,
  getClientUnreadNotificationCount,
  getClientNotifications,
  markClientNotificationAsRead,
  markAllClientNotificationsAsRead,
  deleteClientNotification,
  Notification,
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
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

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

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getClientUnreadNotificationCount();
      if (result.success && result.count !== undefined) {
        setUnreadNotificationCount(result.count);
      }
    } catch (error) {
      console.error("읽지 않은 알림 개수 조회 오류:", error);
    }
  }, []);

  // 읽지 않은 알림 개수 조회 (페이지 로드 시 + 알림 변경 이벤트)
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      fetchUnreadCount();
    };

    window.addEventListener(
      "client-notifications:updated",
      handleNotificationsUpdated
    );
    return () => {
      window.removeEventListener(
        "client-notifications:updated",
        handleNotificationsUpdated
      );
    };
  }, [fetchUnreadCount]);

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

  // 알림 드롭다운 외부 클릭 시 닫기
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

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
  };

  const notifyUnreadCountUpdated = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("client-notifications:updated"));
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);
      const result = await getClientNotifications();
      if (result.success && result.data) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error("알림 조회 오류:", error);
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
      const result = await markClientNotificationAsRead(notification.id);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
        notifyUnreadCountUpdated();
        router.refresh();
      }
    }

    if (notification.work_request_id) {
      router.push(
        `/client/approvals?workRequestId=${encodeURIComponent(
          notification.work_request_id
        )}`
      );
    }
  };

  const handleAllNotificationsRead = async () => {
    const result = await markAllClientNotificationsAsRead();
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotificationCount(0);
      notifyUnreadCountUpdated();
      router.refresh();
    }
  };

  const handleDeleteNotification = async (
    event: React.MouseEvent<HTMLButtonElement>,
    notification: Notification
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const result = await deleteClientNotification(notification.id);
    if (result.success) {
      setNotifications((prev) =>
        prev.filter((item) => item.id !== notification.id)
      );
      if (!notification.is_read) {
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
        notifyUnreadCountUpdated();
      }
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

  const isApprovalNotification = (notification: Notification) =>
    notification.type === "work_requested";

  const getNotificationTagLabel = (notification: Notification) => {
    switch (notification.type) {
      case "work_requested":
        return "승인 필요";
      case "work_started":
        return "업무 시작";
      case "work_completed":
        return "업무 완료";
      case "work_approved":
        return "승인 완료";
      case "work_rejected":
        return "승인 거절";
      default:
        return "알림";
    }
  };

  const approvalNotifications = notifications.filter(isApprovalNotification);
  const activityNotifications = notifications.filter(
    (notification) => !isApprovalNotification(notification)
  );

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
                      {approvalNotifications.length > 0 && (
                        <div className={styles.notifySection}>
                          <div className={styles.notifySectionHeader}>
                            <p className={styles.notifySectionTitle}>
                              승인 필요
                            </p>
                            <span className={styles.notifySectionCount}>
                              {approvalNotifications.length}
                            </span>
                          </div>
                          <div className={styles.notifySectionBody}>
                            {approvalNotifications.map((notification) => (
                              <button
                                type="button"
                                key={notification.id}
                                className={`${styles.notifyItem} ${
                                  styles.notifyApprovalItem
                                } ${
                                  !notification.is_read
                                    ? styles.notifyUnread
                                    : ""
                                }`}
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                              >
                                <div className={styles.notifyTop}>
                                  <div className={styles.notifyTitleRow}>
                                    <p>{notification.title || "알림"}</p>
                                    <span
                                      className={`${styles.notifyTag} ${styles.notifyTagApproval}`}
                                    >
                                      {getNotificationTagLabel(notification)}
                                    </span>
                                  </div>
                                  <div className={styles.notifyActions}>
                                    {!notification.is_read && (
                                      <span className={styles.notifyDot} />
                                    )}
                                    <button
                                      type="button"
                                      className={styles.notifyDeleteButton}
                                      aria-label="알림 삭제"
                                      onClick={(event) =>
                                        handleDeleteNotification(
                                          event,
                                          notification
                                        )
                                      }
                                    >
                                      x
                                    </button>
                                  </div>
                                </div>
                                <div className={styles.notifyMid}>
                                  <p>{notification.message}</p>
                                </div>
                                <div className={styles.notifyBot}>
                                  {formatNotificationDate(
                                    notification.created_at
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {activityNotifications.length > 0 && (
                        <div className={styles.notifySection}>
                          <div className={styles.notifySectionHeader}>
                            <p className={styles.notifySectionTitle}>내 활동</p>
                            <span className={styles.notifySectionCount}>
                              {activityNotifications.length}
                            </span>
                          </div>
                          <div className={styles.notifySectionBody}>
                            {activityNotifications.map((notification) => (
                              <button
                                type="button"
                                key={notification.id}
                                className={`${styles.notifyItem} ${
                                  styles.notifyActivityItem
                                } ${
                                  !notification.is_read
                                    ? styles.notifyUnread
                                    : ""
                                }`}
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                              >
                                <div className={styles.notifyTop}>
                                  <div className={styles.notifyTitleRow}>
                                    <p>{notification.title || "알림"}</p>
                                    <span
                                      className={`${styles.notifyTag} ${styles.notifyTagActivity}`}
                                    >
                                      {getNotificationTagLabel(notification)}
                                    </span>
                                  </div>
                                  <div className={styles.notifyActions}>
                                    {!notification.is_read && (
                                      <span className={styles.notifyDot} />
                                    )}
                                    <button
                                      type="button"
                                      className={styles.notifyDeleteButton}
                                      aria-label="알림 삭제"
                                      onClick={(event) =>
                                        handleDeleteNotification(
                                          event,
                                          notification
                                        )
                                      }
                                    >
                                      x
                                    </button>
                                  </div>
                                </div>
                                <div className={styles.notifyMid}>
                                  <p>{notification.message}</p>
                                </div>
                                <div className={styles.notifyBot}>
                                  {formatNotificationDate(
                                    notification.created_at
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
      <footer className={styles.footer}>
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
