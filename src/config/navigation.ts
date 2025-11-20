export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
};

export const mainNav: NavItem[] = [
  {
    label: '대시보드',
    href: '/dashboard',
    icon: 'layout-dashboard'
  },
  {
    label: '거래처 관리',
    href: '/clients',
    icon: 'building-2',
    children: [
      { label: '거래처 조회', href: '/clients' },
      { label: '거래처 등록', href: '/clients/new' }
    ]
  },
  {
    label: '계약 관리',
    href: '/contracts',
    icon: 'file-text',
    children: [
      { label: '계약 조회', href: '/contracts' },
      { label: '계약 등록', href: '/contracts/new' },
      { label: '계약 현황', href: '/contracts/status' },
      { label: '업무 현황', href: '/contracts/tasks' }
    ]
  },
  {
    label: '관리 업무',
    href: '/operations/tasks',
    icon: 'workflow',
    children: [
      { label: '관리고객 등록', href: '/operations/clients' },
      { label: '관리업무 등록', href: '/operations/new' },
      { label: '관리업무 현황', href: '/operations/tasks' }
    ]
  },
  {
    label: '일정 관리',
    href: '/schedule',
    icon: 'calendar'
  },
  {
    label: '직원 관리',
    href: '/staff',
    icon: 'users',
    children: [
      { label: '직원 조회', href: '/staff' },
      { label: '회원가입 승인', href: '/staff/approvals' }
    ]
  },
  {
    label: '연차 관리',
    href: '/vacations',
    icon: 'plane'
  }
];







