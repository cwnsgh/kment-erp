import { ContractForm } from '@/components/contracts/contract-form';
import { PageHeader } from '@/components/layout/page-header';

export default function ContractCreatePage() {
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








