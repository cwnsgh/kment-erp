"use client";

import { useState, useEffect } from "react";
import {
  getClientNotifications,
  markClientNotificationAsRead,
  markAllClientNotificationsAsRead,
  Notification,
} from "@/app/actions/work-request";
import { useRouter } from "next/navigation";
import styles from "./client-notifications.module.css";

export function ClientNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const result = await getClientNotifications();
      if (result.success && result.data) {
        setNotifications(result.data);
        const unread = result.data.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("알림 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markClientNotificationAsRead(notificationId);
    if (result.success) {
      // 로컬 상태 업데이트
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      // 페이지 새로고침하여 알림 개수 업데이트
      router.refresh();
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllClientNotificationsAsRead();
    if (result.success) {
      // 로컬 상태 업데이트
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      // 페이지 새로고침하여 알림 개수 업데이트
      router.refresh();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  if (loading) {
    return <div className={styles.loading}>알림을 불러오는 중...</div>;
  }

  return (
    <div className={styles.notificationsPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>알림</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className={styles.markAllReadButton}
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={styles.empty}>알림이 없습니다.</div>
      ) : (
        <div className={styles.notificationList}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`${styles.notificationItem} ${
                !notification.is_read ? styles.unread : ""
              }`}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div className={styles.notificationContent}>
                <p className={styles.message}>{notification.message}</p>
                <span className={styles.date}>
                  {formatDate(notification.created_at)}
                </span>
              </div>
              {!notification.is_read && (
                <span className={styles.unreadBadge}>읽지 않음</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


