"use client";

import Link from "next/link";
import styles from "./client-dashboard-none.module.css";

type ClientDashboardNoneProps = {
  clientName: string;
  unreadNotificationCount?: number;
};

export function ClientDashboardNone({
  clientName,
  unreadNotificationCount = 0,
}: ClientDashboardNoneProps) {
  return (
    <section className={styles.section}>
      <div className={styles.pageTitle}>
        <h1 className={styles.pageTitleHeading}>
          <span className={styles.pageTitleName}>{clientName}</span>님,
          안녕하세요!
        </h1>
        {unreadNotificationCount > 0 && (
          <Link
            href="/client/notifications"
            className={styles.notificationBadge}
          >
            알림 {unreadNotificationCount}건
          </Link>
        )}
      </div>
      <div
        className={`${styles.whiteBox} ${styles.typeBox} ${styles.typeNone}`}
      >
        <p>등록된 관리 상품이 없습니다.</p>
      </div>
    </section>
  );
}
