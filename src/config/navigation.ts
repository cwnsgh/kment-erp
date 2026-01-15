export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
  badge?: number; // 알림 뱃지 (예: 회원가입 승인 관리)
  allowedRoleIds?: number[]; // 허용할 role ID 배열 (없으면 모든 role 접근 가능)
};

export const mainNav: NavItem[] = [
  {
    label: "대시보드",
    href: "/dashboard",
    icon: "layout-dashboard",
  },
  {
    label: "거래처 관리",
    href: "/clients",
    icon: "building-2",
    children: [
      { label: "거래처 목록", href: "/clients" },
      { label: "신규 등록", href: "/clients/new" },
    ],
  },
  {
    label: "상담 관리",
    href: "/consultation",
    icon: "phone",
    allowedRoleIds: [1],
    children: [
      { label: "상담 내역", href: "/consultation" },
      { label: "상담 등록", href: "/consultation/new" },
    ],
  },
  {
    label: "계약 관리",
    href: "/contracts",
    icon: "file-text",
    children: [
      { label: "계약 조회", href: "/contracts" },
      { label: "계약 등록", href: "/contracts/new" },
      { label: "계약 현황", href: "/contracts/status" },
      { label: "업무 현황", href: "/contracts/tasks" },
    ],
  },
  {
    label: "일정 관리",
    href: "/schedule",
    icon: "calendar", // clock_icon 사용
    children: [
      { label: "일정 등록", href: "/schedule/new" },
      { label: "일정 조회", href: "/schedule" },
    ],
  },
  {
    label: "관리 업무",
    href: "/operations/tasks",
    icon: "workflow",
    children: [
      { label: "관리 업무 현황", href: "/operations/tasks" },
      { label: "관리 고객 조회", href: "/operations/clients" },
      { label: "관리 고객 등록", href: "/operations/clients/new" },
      { label: "관리 업무 등록", href: "/operations/new" },
    ],
  },
  {
    label: "직원 관리",
    href: "/staff",
    icon: "users",
    allowedRoleIds: [1, 2, 3],
    children: [
      { label: "직원 조회", href: "/staff" },
      { label: "직원 등록", href: "/staff/new" },
      { label: "직원 관리", href: "/staff/manage" },
    ],
  },
  {
    label: "연차 관리",
    href: "/vacations",
    icon: "plane",
    children: [
      { label: "연차 현황", href: "/vacations" },
      { label: "연차 신청", href: "/vacations/new" },
    ],
  },
  {
    label: "관리자 페이지",
    href: "/admin",
    icon: "lock",
    allowedRoleIds: [1, 2, 3],
    children: [
      { label: "업무 삭제 내역", href: "/admin/deleted-tasks" },
      {
        label: "로그 관리",
        href: "/admin/logs",
        children: [
          { label: "거래처 관리", href: "/admin/logs/clients" },
          { label: "계약 관리", href: "/admin/logs/contracts" },
          { label: "고객사 관리", href: "/admin/logs/customers" },
        ],
      },
      { label: "회원가입 승인 관리", href: "/staff/approvals", badge: 0 },
    ],
  },
];
