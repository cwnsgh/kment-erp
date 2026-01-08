import { getSession, ClientSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getClientWorkRequests, WorkRequest } from '@/app/actions/work-request';
import { ClientWorkList } from '@/components/client/client-work-list';

export default async function ClientTasksPage() {
  const session = await getSession();
  
  if (!session || session.type !== 'client') {
    redirect('/login');
  }

  const clientSession = session as ClientSession;

  // 클라이언트의 작업 요청 조회
  const result = await getClientWorkRequests(clientSession.id, {
    statusFilter: "all",
    page: 1,
    limit: 20,
  });

  const workRequests = result.success && result.data ? result.data : [];
  const totalCount = result.totalCount || 0;

  // 클라이언트 이름 가져오기
  const supabase = await getSupabaseServerClient();
  const { data: client } = await supabase
    .from('client')
    .select('name')
    .eq('id', clientSession.id)
    .single();

  return (
    <ClientWorkList
      initialWorkRequests={workRequests}
      initialTotalCount={totalCount}
      clientName={client?.name || ""}
    />
  );
}

