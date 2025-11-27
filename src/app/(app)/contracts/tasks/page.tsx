import { ContractTaskBoard } from '@/components/contracts/contract-task-board';
import { PageHeader } from '@/components/layout/page-header';

export default function ContractTaskPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="계약 업무 현황"
        description="계약별 진행 업무, 승인 상태, 담당자 기록을 관리합니다."
      />
      <ContractTaskBoard />
    </div>
  );
}








