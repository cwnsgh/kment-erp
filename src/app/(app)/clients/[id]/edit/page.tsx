import { ClientEditForm } from '@/components/clients/client-edit-form';
import { PageHeader } from '@/components/layout/page-header';
import { getClientDetail } from '@/app/actions/client';
import { notFound } from 'next/navigation';

type ClientEditPageProps = {
  params: {
    id: string;
  };
};

export default async function ClientEditPage({ params }: ClientEditPageProps) {
  const result = await getClientDetail(params.id);

  if (!result.success || !result.client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="거래처 수정"
        description="거래처 정보를 수정합니다."
      />
      <ClientEditForm client={result.client} clientId={params.id} />
    </div>
  );
}


