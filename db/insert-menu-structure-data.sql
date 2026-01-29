-- 초기 메뉴 구조 데이터 삽입
-- 이 파일은 menu-permission-schema.sql을 실행한 후 데이터가 없을 때 사용하세요

INSERT INTO erp.menu_structure (category_key, category_name, menu_key, menu_name, navigation_path, display_order, is_active) VALUES
-- 거래처 관리
('client-management', '거래처관리', 'client-list', '거래처목록', '/clients', 1, true),
('client-management', '거래처관리', 'client-register', '신규등록', '/clients/new', 2, true),

-- 상담 관리
('consultation', '상담관리', 'consultation-list', '상담내역', '/consultation', 1, true),
('consultation', '상담관리', 'consultation-register', '상담등록', '/consultation/new', 2, true),

-- 계약 관리
('contract', '계약관리', 'contract-list', '계약조회', '/contracts', 1, true),
('contract', '계약관리', 'contract-register', '계약등록', '/contracts/new', 2, true),
('contract', '계약관리', 'contract-status', '계약현황', '/contracts/status', 3, true),
('contract', '계약관리', 'contract-tasks', '업무현황', '/contracts/tasks', 4, true),

-- 일정 관리
('schedule', '일정관리', 'schedule-register', '일정등록', '/schedule/new', 1, true),
('schedule', '일정관리', 'schedule-list', '일정조회', '/schedule', 2, true),

-- 관리 업무
('operations', '관리업무', 'operations-tasks', '관리업무현황', '/operations/tasks', 1, true),
('operations', '관리업무', 'operations-clients-list', '관리고객조회', '/operations/clients', 2, true),
('operations', '관리업무', 'operations-clients-register', '관리고객등록', '/operations/clients/new', 3, true),
('operations', '관리업무', 'operations-register', '관리업무등록', '/operations/new', 4, true),

-- 직원 관리
('staff', '직원관리', 'staff-list', '직원조회', '/staff', 1, true),
('staff', '직원관리', 'staff-register', '직원등록', '/staff/new', 2, true),
('staff', '직원관리', 'staff-manage', '직원관리', '/staff/manage', 3, true),

-- 연차 관리
('vacation', '연차관리', 'vacation-status', '연차현황', '/vacations', 1, true),
('vacation', '연차관리', 'vacation-apply', '연차신청', '/vacations/new', 2, true),

-- 관리자 페이지
('admin', '관리자페이지', 'admin-deleted-tasks', '업무삭제내역', '/admin/deleted-tasks', 1, true),
('admin', '관리자페이지', 'admin-logs', '로그관리', '/admin/logs', 2, true),
('admin', '관리자페이지', 'admin-approvals', '회원가입승인관리', '/staff/approvals', 3, true),
('admin', '관리자페이지', 'admin-permissions', '메뉴권한관리', '/admin/permissions', 4, true)
ON CONFLICT (category_key, menu_key) DO NOTHING;

