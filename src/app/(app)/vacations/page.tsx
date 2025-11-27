import { ComingSoon } from '@/components/layout/coming-soon';
import { PageHeader } from '@/components/layout/page-header';

export default function VacationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="연차 관리"
        description="연차 신청과 승인 흐름을 관리할 수 있는 화면입니다."
        cta={{ label: '연차 정책 설정', href: '#' }}
      />
      <ComingSoon feature="연차 관리" />
    </div>
  );
}








