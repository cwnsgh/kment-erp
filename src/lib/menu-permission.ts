/**
 * 경로를 menu_key로 변환하는 유틸리티
 * navigation_path와 일치하는 menu_key를 반환
 */

// 경로 -> menu_key 매핑 (menu_structure 기반)
const pathToMenuKeyMap: Record<string, string> = {
  // 거래처 관리
  "/clients": "client-list",
  "/clients/new": "client-register",
  
  // 상담 관리
  "/consultation": "consultation-list",
  "/consultation/new": "consultation-register",
  
  // 계약 관리
  "/contracts": "contract-list",
  "/contracts/new": "contract-register",
  "/contracts/status": "contract-status",
  "/contracts/tasks": "contract-tasks",
  
  // 일정 관리
  "/schedule/new": "schedule-register",
  "/schedule": "schedule-list",
  
  // 관리 업무
  "/operations/tasks": "operations-tasks",
  "/operations/clients": "operations-clients-list",
  "/operations/clients/new": "operations-clients-register",
  "/operations/new": "operations-register",
  
  // 직원 관리
  "/staff": "staff-list",
  "/staff/new": "staff-register",
  "/staff/manage": "staff-manage",
  
  // 연차 관리
  "/vacations": "vacation-status",
  "/vacations/new": "vacation-apply",
  
  // 관리자 페이지
  "/admin/deleted-tasks": "admin-deleted-tasks",
  "/admin/logs": "admin-logs",
  "/admin/logs/clients": "admin-logs",
  "/admin/logs/contracts": "admin-logs",
  "/admin/logs/customers": "admin-logs",
  "/staff/approvals": "admin-approvals",
  "/admin/permissions": "admin-permissions",
};

/**
 * 경로에서 menu_key 추출
 * @param pathname - 경로 (예: /contracts/new)
 * @returns menu_key 또는 null
 */
export function getMenuKeyFromPath(pathname: string): string | null {
  // 정확한 매칭 먼저 시도
  if (pathToMenuKeyMap[pathname]) {
    return pathToMenuKeyMap[pathname];
  }
  
  // 부분 매칭 (예: /admin/logs/clients -> admin-logs)
  for (const [path, menuKey] of Object.entries(pathToMenuKeyMap)) {
    if (pathname.startsWith(path)) {
      return menuKey;
    }
  }
  
  return null;
}

/**
 * 권한 체크가 필요한 경로인지 확인
 * @param pathname - 경로
 * @returns 권한 체크 필요 여부
 */
export function requiresPermissionCheck(pathname: string): boolean {
  // 대시보드는 권한 체크 불필요
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard")) {
    return false;
  }
  
  // 로그인, 회원가입 페이지는 권한 체크 불필요
  if (pathname === "/login" || pathname === "/signup") {
    return false;
  }
  
  // API 경로는 권한 체크 불필요 (각 API에서 처리)
  if (pathname.startsWith("/api")) {
    return false;
  }
  
  // 정적 파일은 권한 체크 불필요
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return false;
  }
  
  // menu_key가 있으면 권한 체크 필요
  return getMenuKeyFromPath(pathname) !== null;
}

