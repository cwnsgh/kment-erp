import { ClientForm } from '@/components/clients/client-form';
import { PageHeader } from '@/components/layout/page-header';
import { requireMenuPermission } from '@/lib/require-menu-permission';

export default async function ClientCreatePage() {
  // 권한 체크 (권한이 없으면 자동으로 리다이렉트)
  await requireMenuPermission('/clients/new');
  
  return <ClientForm />;
}








