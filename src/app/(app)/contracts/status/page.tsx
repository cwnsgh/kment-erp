import { Suspense } from "react";
import { getContractStatusData } from "@/app/actions/contract";
import { ContractStatusView } from "@/components/contracts/contract-status-view";
import { requireMenuPermission } from "@/lib/require-menu-permission";
import styles from "./page.module.css";

type PageProps = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function ContractStatusPage({ searchParams }: PageProps) {
  await requireMenuPermission("/contracts/status");

  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;

  const result = await getContractStatusData(year, month);

  if (!result.success || !result.data) {
    return (
      <div className={`${styles.statusPage} page_section`}>
        <div className="page_title">
          <h1>계약 현황</h1>
        </div>
        <div className={styles.errorBlock}>
          {result.error ?? "데이터를 불러오지 못했습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.statusPage} page_section`}>
      <div className="page_title">
        <h1>계약 현황</h1>
      </div>
      <Suspense
        fallback={
          <div className={styles.loadingBlock}>로딩 중...</div>
        }>
        <ContractStatusView data={result.data} year={year} month={month} />
      </Suspense>
    </div>
  );
}
