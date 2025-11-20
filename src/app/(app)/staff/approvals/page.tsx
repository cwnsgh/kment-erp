import { getPendingSignupRequests } from '@/app/actions/client-approval';
import { PageHeader } from '@/components/layout/page-header';
import { SignupApprovalList } from '@/components/staff/signup-approval-list';

export default async function SignupApprovalsPage() {
  const result = await getPendingSignupRequests();

  return (
    <div className="space-y-6">
      <PageHeader
        title="회원가입 승인 관리"
        description="회원가입 요청을 검토하고 승인 또는 거절할 수 있습니다."
      />

      {result.success && result.data ? (
        <SignupApprovalList requests={result.data} />
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {result.error || '승인 대기 목록을 불러올 수 없습니다.'}
        </div>
      )}
    </div>
  );
}





