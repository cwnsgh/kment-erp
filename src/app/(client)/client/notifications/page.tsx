import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ClientNotifications } from '@/components/client/client-notifications';

export default async function ClientNotificationsPage() {
  const session = await getSession();
  
  if (!session || session.type !== 'client') {
    redirect('/login');
  }

  return <ClientNotifications />;
}

