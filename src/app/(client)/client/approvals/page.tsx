import { getSession, ClientSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getPendingWorkRequestsByClientId, WorkRequest } from '@/app/actions/work-request';
import { ClientApprovalPage } from '@/components/client/client-approval-page';

export default async function ClientApprovalsPage() {
  const session = await getSession();
  
  if (!session || session.type !== 'client') {
    redirect('/login');
  }

  const clientSession = session as ClientSession;
  
  // 승인 대기 업무 요청 조회
  const result = await getPendingWorkRequestsByClientId(clientSession.id);
  const workRequests = result.success && result.data ? result.data : [];

  // 클라이언트 이름 가져오기
  const supabase = await getSupabaseServerClient();
  const { data: client } = await supabase
    .from('client')
    .select('name')
    .eq('id', clientSession.id)
    .single();

  return (
    <ClientApprovalPage
      initialWorkRequests={workRequests}
      clientName={client?.name || ""}
    />
  );
}
