import { ContractStatusBoard } from '@/components/contracts/contract-status-board';
import { PageHeader } from '@/components/layout/page-header';

export default function ContractStatusPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="계약 현황"
        description="진행 단계별 계약 건수를 확인하고 세부 정보를 살펴봅니다."
      />
      <ContractStatusBoard />
    </div>
  );
}








