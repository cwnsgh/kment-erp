import { ContractTable } from '@/components/contracts/contract-table';
import { PageHeader } from '@/components/layout/page-header';

export default function ContractListPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="계약 조회"
        description="거래처와 연결된 계약을 검색하고 상태를 확인합니다."
        cta={{ label: '계약 등록', href: '/contracts/new' }}
      />
      <ContractTable />
    </div>
  );
}








