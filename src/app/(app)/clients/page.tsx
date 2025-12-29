import { ClientTable } from '@/components/clients/client-table';
import { PageHeader } from '@/components/layout/page-header';
import { getClients } from '@/app/actions/client';

export default async function ClientListPage() {
  const result = await getClients();
  const clients = result.success ? result.clients : [];

  return (
    <div className="page_section">
      <div className="page_title">
        <h1>거래처 조회</h1>
        <div className="btn_wrap">
          <a href="/clients/new" className="btn btn_lg primary">
            거래처 등록
          </a>
        </div>
      </div>
      <ClientTable initialClients={clients} />
    </div>
  );
}








