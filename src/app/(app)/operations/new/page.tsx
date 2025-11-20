import { OperationRequestForm } from '@/components/operations/operation-request-form';
import { PageHeader } from '@/components/layout/page-header';

export default function OperationRequestPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="관리업무 등록"
        description="진행 예정 업무를 계획하고 고객 승인을 요청합니다."
      />
      <OperationRequestForm />
    </div>
  );
}







