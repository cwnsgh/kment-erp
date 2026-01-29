import { ContractForm } from '@/components/contracts/contract-form';
import { PageHeader } from '@/components/layout/page-header';
import { requireMenuPermission } from '@/lib/require-menu-permission';

export default async function ContractCreatePage() {
  // 권한 체크 (권한이 없으면 자동으로 리다이렉트)
  await requireMenuPermission('/contracts/new');
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="계약 등록"
        description="선택한 거래처를 기반으로 신규 계약을 생성합니다."
      />
      <ContractForm />
    </div>
  );
}








