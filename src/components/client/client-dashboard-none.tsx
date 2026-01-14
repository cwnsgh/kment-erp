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
    <section className={`${styles.customerMain} customer_main main page_section`}>
      <div className="page_title">
        <h1>
          <span>{clientName}</span>님, 안녕하세요!
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
      <div className="white_box type_box type_n">
        <div>
          <p>등록된 관리 상품이 없습니다.</p>
        </div>
      </div>
    </section>
  );
}


