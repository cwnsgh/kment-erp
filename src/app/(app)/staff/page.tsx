import { ComingSoon } from '@/components/layout/coming-soon';
import { PageHeader } from '@/components/layout/page-header';

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="직원 관리"
        description="직원 계정, 역할, 권한을 관리할 수 있는 화면입니다."
        cta={{ label: '직원 초대', href: '#' }}
      />
      <ComingSoon feature="직원 관리" />
    </div>
  );
}








