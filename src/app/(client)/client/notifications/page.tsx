import { getSession, ClientSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getClientUnreadNotificationCount } from '@/app/actions/work-request';

export default async function ClientNotificationsPage() {
  const session = await getSession();
  
  if (!session || session.type !== 'client') {
    redirect('/login');
  }

  const unreadCountResult = await getClientUnreadNotificationCount();
  const unreadCount = unreadCountResult.success && unreadCountResult.count ? unreadCountResult.count : 0;

  return (
    <div>
      <h1>알림</h1>
      <p>읽지 않은 알림: {unreadCount}건</p>
      {/* TODO: 알림 페이지 컴포넌트 추가 */}
    </div>
  );
}

