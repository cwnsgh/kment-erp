import { Suspense } from "react";
import Link from "next/link";
import { requireMenuPermission } from "@/lib/require-menu-permission";
import { getConsultations } from "@/app/actions/consultation";
import { ConsultationTable } from "@/components/consultation/consultation-table";
import styles from "./page.module.css";

async function ConsultationContent() {
  const result = await getConsultations();
  const list = result.success ? result.data ?? [] : [];

  return <ConsultationTable initialList={list} />;
}

export default async function ConsultationPage() {
  await requireMenuPermission("/consultation");

  return (
    <div className={`${styles.consultationPage} page_section`}>
      <div className="page_title">
        <h1>상담 내역</h1>
        <div className="btn_wrap">
          <Link href="/consultation/new" className="btn btn_lg primary">
            상담 등록
          </Link>
        </div>
      </div>
      <div className={styles.whiteBox}>
        <div className={styles.boxInner}>
          <Suspense fallback={<div className="text-sm text-gray-500">로딩 중...</div>}>
            <ConsultationContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
