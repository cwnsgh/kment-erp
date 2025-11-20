import { ClientTable } from '@/components/clients/client-table';
import { PageHeader } from '@/components/layout/page-header';

export default function ClientListPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="거래처 조회"
        description="등록된 거래처를 검색하고 상세 정보를 확인합니다."
        cta={{ label: '거래처 등록', href: '/clients/new' }}
      />
      <ClientTable />
    </div>
  );
}







