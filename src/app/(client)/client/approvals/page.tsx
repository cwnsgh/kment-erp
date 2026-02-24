import { getSession, ClientSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAllWorkRequestsByClientId, WorkRequest } from '@/app/actions/work-request';
import { getClientContractWorkRequests } from '@/app/actions/contract-work-request';
import { ClientApprovalPage } from '@/components/client/client-approval-page';

const INITIAL_CONTRACT_PAGE_SIZE = 10;

export default async function ClientApprovalsPage() {
  const session = await getSession();

  if (!session || session.type !== 'client') {
    redirect('/login');
  }

  const clientSession = session as ClientSession;

  // 관리 업무: 모든 업무 요청 조회 (승인 페이지용)
  const result = await getAllWorkRequestsByClientId(clientSession.id);
  const workRequests = result.success && result.data ? result.data : [];

  // 계약 업무: 1페이지 미리 조회 (탭 전환 시 즉시 표시용)
  const contractResult = await getClientContractWorkRequests(clientSession.id, {
    statusFilter: 'all',
    page: 1,
    limit: INITIAL_CONTRACT_PAGE_SIZE,
  });
  const initialContractWorkRequests =
    contractResult.success && contractResult.data ? contractResult.data : [];
  const initialContractTotalCount = contractResult.totalCount ?? 0;

  const supabase = await getSupabaseServerClient();
  const { data: client } = await supabase
    .from('client')
    .select('name')
    .eq('id', clientSession.id)
    .single();

  return (
    <ClientApprovalPage
      initialWorkRequests={workRequests}
      initialContractWorkRequests={initialContractWorkRequests}
      initialContractTotalCount={initialContractTotalCount}
      clientName={client?.name || ''}
    />
  );
}
