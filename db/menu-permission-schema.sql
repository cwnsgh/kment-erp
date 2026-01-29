-- ============================================
-- 메뉴 권한 관리 시스템 스키마
-- ============================================
-- 대표만 접근 가능한 메뉴 권한 관리 기능
-- 카테고리별(대분류) 세부 메뉴 단위 권한 관리

-- ============================================
-- 1. 메뉴 구조 테이블 (메뉴 카탈로그)
-- ============================================
CREATE TABLE IF NOT EXISTS erp.menu_structure (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category_key text NOT NULL,        -- 대분류 키 (예: 'client-management', 'consultation')
  category_name text NOT NULL,        -- 대분류명 (예: '거래처관리', '상담관리')
  menu_key text NOT NULL,             -- 세부 메뉴 키 (예: 'client-list', 'client-register')
  menu_name text NOT NULL,            -- 세부 메뉴명 (예: '거래처목록', '신규등록')
  navigation_path text NOT NULL,      -- 실제 라우트 경로 (예: '/clients', '/clients/new')
  display_order integer NOT NULL,    -- 표시 순서
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_structure_pkey PRIMARY KEY (id),
  CONSTRAINT menu_structure_unique UNIQUE (category_key, menu_key)
);

-- ============================================
-- 2. 메뉴 권한 테이블 (직원별 권한 데이터)
-- ============================================
-- 기존 테이블이 있으면 삭제 (주의: 데이터가 있으면 백업 필요)
DROP TABLE IF EXISTS erp.menu_permission CASCADE;

CREATE TABLE erp.menu_permission (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  menu_key text NOT NULL,             -- 세부 메뉴 키 (menu_structure.menu_key 참조)
  employee_id uuid NOT NULL,           -- 직원 ID
  allowed boolean NOT NULL DEFAULT true, -- 허용 여부
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_permission_pkey PRIMARY KEY (id),
  CONSTRAINT menu_permission_unique UNIQUE (menu_key, employee_id),
  CONSTRAINT menu_permission_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES erp.employee(id) ON DELETE CASCADE
);

-- ============================================
-- 3. 인덱스 추가
-- ============================================
CREATE INDEX IF NOT EXISTS idx_menu_structure_category_key ON erp.menu_structure(category_key);
CREATE INDEX IF NOT EXISTS idx_menu_structure_menu_key ON erp.menu_structure(menu_key);
CREATE INDEX IF NOT EXISTS idx_menu_structure_active ON erp.menu_structure(is_active);

CREATE INDEX IF NOT EXISTS idx_menu_permission_menu_key ON erp.menu_permission(menu_key);
CREATE INDEX IF NOT EXISTS idx_menu_permission_employee_id ON erp.menu_permission(employee_id);
CREATE INDEX IF NOT EXISTS idx_menu_permission_allowed ON erp.menu_permission(allowed);

-- ============================================
-- 4. 권한 부여
-- ============================================
-- 스키마 권한
GRANT USAGE ON SCHEMA erp TO authenticated;
GRANT USAGE ON SCHEMA erp TO service_role;

-- 테이블 권한
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_structure TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_structure TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_permission TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_permission TO service_role;

-- 시퀀스 권한 (uuid_generate_v4 사용)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA erp TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA erp TO service_role;

-- ============================================
-- 5. 초기 메뉴 구조 데이터 삽입
-- ============================================
INSERT INTO erp.menu_structure (category_key, category_name, menu_key, menu_name, navigation_path, display_order) VALUES
-- 거래처 관리
('client-management', '거래처관리', 'client-list', '거래처목록', '/clients', 1),
('client-management', '거래처관리', 'client-register', '신규등록', '/clients/new', 2),

-- 상담 관리
('consultation', '상담관리', 'consultation-list', '상담내역', '/consultation', 1),
('consultation', '상담관리', 'consultation-register', '상담등록', '/consultation/new', 2),

-- 계약 관리
('contract', '계약관리', 'contract-list', '계약조회', '/contracts', 1),
('contract', '계약관리', 'contract-register', '계약등록', '/contracts/new', 2),
('contract', '계약관리', 'contract-status', '계약현황', '/contracts/status', 3),
('contract', '계약관리', 'contract-tasks', '업무현황', '/contracts/tasks', 4),

-- 일정 관리
('schedule', '일정관리', 'schedule-register', '일정등록', '/schedule/new', 1),
('schedule', '일정관리', 'schedule-list', '일정조회', '/schedule', 2),

-- 관리 업무
('operations', '관리업무', 'operations-tasks', '관리업무현황', '/operations/tasks', 1),
('operations', '관리업무', 'operations-clients-list', '관리고객조회', '/operations/clients', 2),
('operations', '관리업무', 'operations-clients-register', '관리고객등록', '/operations/clients/new', 3),
('operations', '관리업무', 'operations-register', '관리업무등록', '/operations/new', 4),

-- 직원 관리
('staff', '직원관리', 'staff-list', '직원조회', '/staff', 1),
('staff', '직원관리', 'staff-register', '직원등록', '/staff/new', 2),
('staff', '직원관리', 'staff-manage', '직원관리', '/staff/manage', 3),

-- 연차 관리
('vacation', '연차관리', 'vacation-status', '연차현황', '/vacations', 1),
('vacation', '연차관리', 'vacation-apply', '연차신청', '/vacations/new', 2),

-- 관리자 페이지
('admin', '관리자페이지', 'admin-deleted-tasks', '업무삭제내역', '/admin/deleted-tasks', 1),
('admin', '관리자페이지', 'admin-logs', '로그관리', '/admin/logs', 2),
('admin', '관리자페이지', 'admin-approvals', '회원가입승인관리', '/staff/approvals', 3),
('admin', '관리자페이지', 'admin-permissions', '메뉴권한관리', '/admin/permissions', 4)
ON CONFLICT (category_key, menu_key) DO NOTHING;

-- ============================================
-- 6. 주석 추가
-- ============================================
COMMENT ON TABLE erp.menu_structure IS '메뉴 구조 카탈로그 - 대분류와 세부 메뉴 정보';
COMMENT ON COLUMN erp.menu_structure.category_key IS '대분류 키 (예: client-management, consultation)';
COMMENT ON COLUMN erp.menu_structure.category_name IS '대분류명 (예: 거래처관리, 상담관리)';
COMMENT ON COLUMN erp.menu_structure.menu_key IS '세부 메뉴 키 (예: client-list, client-register)';
COMMENT ON COLUMN erp.menu_structure.menu_name IS '세부 메뉴명 (예: 거래처목록, 신규등록)';
COMMENT ON COLUMN erp.menu_structure.navigation_path IS '실제 라우트 경로 (예: /clients, /clients/new)';

COMMENT ON TABLE erp.menu_permission IS '메뉴별 직원 접근 권한 관리';
COMMENT ON COLUMN erp.menu_permission.menu_key IS '세부 메뉴 키 (menu_structure.menu_key 참조)';
COMMENT ON COLUMN erp.menu_permission.employee_id IS '직원 ID';
COMMENT ON COLUMN erp.menu_permission.allowed IS '접근 허용 여부';

-- ============================================
-- 7. 메뉴 구조 관리 함수 (선택사항)
-- ============================================
-- 메뉴 추가/수정/삭제를 위한 트리거 함수
CREATE OR REPLACE FUNCTION erp.update_menu_structure_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_menu_structure_updated_at
  BEFORE UPDATE ON erp.menu_structure
  FOR EACH ROW
  EXECUTE FUNCTION erp.update_menu_structure_updated_at();

-- ============================================
-- 참고사항
-- ============================================
-- 1. 권한 설정은 대표만 가능하도록 코드에서 체크 필요
-- 2. 네비게이션 바 표시 로직:
--    - 대분류 표시: 해당 대분류의 세부 메뉴 중 하나라도 권한이 있으면 표시
--    - 세부 메뉴 표시: 해당 세부 메뉴에 권한이 있으면 표시
-- 3. 초기 권한 데이터는 없음 (직원별로 개별 설정)
-- 4. 관리자(role_id: 1)인 직원들은 모든 메뉴에 접근 가능하도록 코드에서 처리 권장
--
-- ============================================
-- 메뉴 관리 방법
-- ============================================
-- 1. 메뉴 추가:
--    INSERT INTO erp.menu_structure (category_key, category_name, menu_key, menu_name, navigation_path, display_order)
--    VALUES ('new-category', '새 카테고리', 'new-menu', '새 메뉴', '/new-path', 1);
--
-- 2. 메뉴 이름 변경:
--    UPDATE erp.menu_structure SET menu_name = '변경된 이름' WHERE menu_key = 'client-list';
--    또는 category_name 변경: UPDATE erp.menu_structure SET category_name = '변경된 카테고리' WHERE category_key = 'client-management';
--
-- 3. 메뉴 삭제 (비활성화):
--    UPDATE erp.menu_structure SET is_active = false WHERE menu_key = 'old-menu';
--    (완전 삭제: DELETE FROM erp.menu_structure WHERE menu_key = 'old-menu';
--     단, 관련 권한 데이터도 함께 삭제되므로 주의)
--
-- 4. 메뉴 순서 변경:
--    UPDATE erp.menu_structure SET display_order = 3 WHERE menu_key = 'client-list';
--
-- 5. 라우트 경로 변경:
--    UPDATE erp.menu_structure SET navigation_path = '/new-path' WHERE menu_key = 'client-list';
--
-- 6. UI에서 관리 (권장):
--    관리자 페이지에 "메뉴 구조 관리" 기능 추가하여 UI에서 CRUD 가능하도록 구현
