import { getSession, ClientSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAllWorkRequestsByClientId, WorkRequest } from '@/app/actions/work-request';
import { ClientApprovalPage } from '@/components/client/client-approval-page';

export default async function ClientApprovalsPage() {
  const session = await getSession();
  
  if (!session || session.type !== 'client') {
    redirect('/login');
  }

  const clientSession = session as ClientSession;
  
  // 모든 업무 요청 조회 (승인 페이지용 - 모든 상태 포함)
  const result = await getAllWorkRequestsByClientId(clientSession.id);
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
