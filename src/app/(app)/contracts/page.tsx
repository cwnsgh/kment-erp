import { Suspense } from "react";
import { ContractTable } from '@/components/contracts/contract-table';
import { getContracts } from '@/app/actions/contract';
import styles from "./page.module.css";

async function ContractsContent() {
  const result = await getContracts();
  const contracts = result.success ? result.contracts || [] : [];

  return <ContractTable initialContracts={contracts} />;
}

export default function ContractListPage() {
  return (
    <div className={`${styles.contractsPage} page_section`}>
      <div className="page_title">
        <h1>계약 조회</h1>
        <div className="btn_wrap">
          <a href="/contracts/new" className="btn btn_lg primary">
            계약 등록
          </a>
        </div>
      </div>
      <div className={styles.whiteBox}>
        <div className={styles.boxInner}>
          <Suspense fallback={<div className="text-sm text-gray-500">로딩 중...</div>}>
            <ContractsContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}








