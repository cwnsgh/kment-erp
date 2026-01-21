import { Suspense } from 'react';
import { ClientTable } from '@/components/clients/client-table';
import { getClients } from '@/app/actions/client';
import styles from './page.module.css';

async function ClientsContent() {
  const result = await getClients();
  const clients = result.success ? result.clients : [];

  return <ClientTable initialClients={clients} />;
}

export default function ClientListPage() {
  return (
    <div className={`${styles.clientsPage} page_section`}>
      <div className="page_title">
        <h1>거래처 조회</h1>
        <div className="btn_wrap">
          <a href="/clients/new" className="btn btn_lg primary">
            거래처 등록
          </a>
        </div>
      </div>
      <Suspense fallback={<div className="text-sm text-gray-500">로딩 중...</div>}>
        <ClientsContent />
      </Suspense>
    </div>
  );
}








