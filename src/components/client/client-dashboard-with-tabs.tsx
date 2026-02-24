"use client";

import { useState } from "react";
import Link from "next/link";
import { WorkRequest } from "@/app/actions/work-request";
import type { ContractWorkContentItem, ContractWorkRequestItem } from "@/app/actions/contract";
import { ClientDashboardNone } from "@/components/client/client-dashboard-none";
import { ClientDashboardDeduct } from "@/components/client/client-dashboard-deduct";
import { ClientDashboardMaintenance } from "@/components/client/client-dashboard-maintenance";
import { ClientDashboardContract } from "@/components/client/client-dashboard-contract";
import styles from "./client-dashboard-with-tabs.module.css";

export type ContractDashboardItem = {
  id: string;
  contract_name: string;
  brand_name: string;
  draft_due_date: string | null;
  demo_due_date: string | null;
  final_completion_date: string | null;
  open_due_date: string | null;
  work_contents: ContractWorkContentItem[];
  work_requests: ContractWorkRequestItem[];
};

type ApprovalStats = {
  pending: number;
  approved: number;
  rejected: number;
};

type ClientDashboardWithTabsProps = {
  clientName: string;
  unreadNotificationCount?: number;
  contractCount: number;
  contracts: ContractDashboardItem[];
  managedClient: any | null;
  deductedAmount: number;
  approvalRequests: WorkRequest[];
  approvalStats: ApprovalStats;
  workRequests: WorkRequest[];
};

export function ClientDashboardWithTabs({
  clientName,
  unreadNotificationCount = 0,
  contractCount,
  contracts,
  managedClient,
  deductedAmount,
  approvalRequests,
  approvalStats,
  workRequests,
}: ClientDashboardWithTabsProps) {
  const [activeTab, setActiveTab] = useState<"contract" | "manage">(
    contractCount > 0 && !managedClient ? "contract" : "manage"
  );
  const [slideIndex, setSlideIndex] = useState(0);

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

      <div className={styles.tabRow}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === "contract" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("contract")}
        >
          계약 업무 ({contractCount}건)
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === "manage" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("manage")}
        >
          관리 업무
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "contract" && (
          <ClientDashboardContract
            contracts={contracts}
            slideIndex={slideIndex}
            onSlideChange={setSlideIndex}
          />
        )}

        {activeTab === "manage" && (
          <>
            {!managedClient ? (
              <ClientDashboardNone
                clientName={clientName}
                unreadNotificationCount={unreadNotificationCount}
                showGreeting={false}
              />
            ) : managedClient.product_type1 === "deduct" ? (
              <ClientDashboardDeduct
                clientName={clientName}
                managedClient={managedClient}
                deductedAmount={deductedAmount}
                approvalRequests={approvalRequests}
                approvalStats={approvalStats}
                workRequests={workRequests}
                unreadNotificationCount={unreadNotificationCount}
                showGreeting={false}
              />
            ) : (
              <ClientDashboardMaintenance
                clientName={clientName}
                managedClient={managedClient}
                approvalRequests={approvalRequests}
                approvalStats={approvalStats}
                workRequests={workRequests}
                unreadNotificationCount={unreadNotificationCount}
                showGreeting={false}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
