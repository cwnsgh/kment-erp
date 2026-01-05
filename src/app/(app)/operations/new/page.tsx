import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ManageWorkRegistrationForm } from '@/components/operations/manage-work-registration-form';

export default async function OperationRequestPage() {
  const session = await getSession();
  
  if (!session || session.type !== 'employee') {
    redirect('/login');
  }

  return (
    <div style={{ maxWidth: "1600px", width: "100%", margin: "0 auto" }}>
      <ManageWorkRegistrationForm employeeName={session.name} />
    </div>
  );
}








