import { OperationsTaskBoard } from '@/components/operations/operations-task-board';
import { PageHeader } from '@/components/layout/page-header';

export default function OperationsTaskPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="관리업무 현황"
        description="요청된 관리 업무의 진행도를 확인하고 히스토리를 관리합니다."
      />
      <OperationsTaskBoard />
    </div>
  );
}







