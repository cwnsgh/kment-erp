import { ComingSoon } from '@/components/layout/coming-soon';
import { PageHeader } from '@/components/layout/page-header';

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="일정 관리"
        description="프로젝트와 계약 관련 일정을 한눈에 관리합니다."
      />
      <ComingSoon feature="일정 관리" />
    </div>
  );
}








