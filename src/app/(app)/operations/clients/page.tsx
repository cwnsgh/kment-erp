import { ManagedClientForm } from '@/components/operations/managed-client-form';
import { ManagedClientTable } from '@/components/operations/managed-client-table';
import { PageHeader } from '@/components/layout/page-header';

export default function ManagedClientPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="관리고객 등록"
        description="운영 대상 고객을 등록하고 계약과 연동합니다."
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <ManagedClientForm />
        <ManagedClientTable />
      </div>
    </div>
  );
}








