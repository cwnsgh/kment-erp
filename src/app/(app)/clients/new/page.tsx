import { ClientForm } from '@/components/clients/client-form';
import { PageHeader } from '@/components/layout/page-header';

export default function ClientCreatePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="거래처 등록"
        description="사업자 정보와 담당자, 사이트 정보를 입력해 거래처를 등록합니다."
      />
      <ClientForm />
    </div>
  );
}







