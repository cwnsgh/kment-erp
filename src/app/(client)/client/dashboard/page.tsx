import { getSession, ClientSession } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getPendingWorkRequestsByClientId, getClientUnreadNotificationCount, WorkRequest } from '@/app/actions/work-request';
import { ClientDashboard } from '@/components/client/client-dashboard';

export default async function ClientDashboardPage() {
  const session = await getSession();
  
  if (!session || session.type !== 'client') {
    redirect('/login');
  }

  const clientSession = session as ClientSession;
  const supabase = await getSupabaseServerClient();

  // 클라이언트의 관리 상품 조회
  const { data: managedClients, error } = await supabase
    .from('managed_client')
    .select('*')
    .eq('client_id', clientSession.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('관리 상품 조회 오류:', error);
  }

  // 클라이언트 정보 조회
  const { data: client } = await supabase
    .from('client')
    .select('name')
    .eq('id', clientSession.id)
    .single();

  // 가장 최근 관리 상품 (또는 첫 번째)
  const managedClient = managedClients && managedClients.length > 0 
    ? managedClients[0] 
    : null;

  // 클라이언트의 모든 업무 요청 조회 (승인 현황용)
  const { data: allWorkRequests } = await supabase
    .from('work_request')
    .select('*')
    .eq('client_id', clientSession.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // 읽지 않은 알림 개수 조회
  const unreadCountResult = await getClientUnreadNotificationCount();
  const unreadNotificationCount = unreadCountResult.success && unreadCountResult.count ? unreadCountResult.count : 0;

  return (
    <ClientDashboard 
      clientName={client?.name || clientSession.name}
      managedClient={managedClient}
      workRequests={(allWorkRequests || []) as WorkRequest[]}
      unreadNotificationCount={unreadNotificationCount}
    />
  );
}
