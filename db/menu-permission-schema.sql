-- 메뉴 권한 관리 테이블
-- 관리자가 UI에서 메뉴별 직원 권한을 설정할 수 있도록 함

CREATE TABLE IF NOT EXISTS erp.menu_permission (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  menu_key text NOT NULL, -- 메뉴 식별자 (예: 'consultation', 'staff', 'admin')
  employee_id uuid NOT NULL, -- 직원 ID
  allowed boolean NOT NULL DEFAULT true, -- 허용 여부
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_permission_pkey PRIMARY KEY (id),
  CONSTRAINT menu_permission_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES erp.employee(id) ON DELETE CASCADE,
  CONSTRAINT menu_permission_unique UNIQUE (menu_key, employee_id)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_menu_permission_menu_key ON erp.menu_permission(menu_key);
CREATE INDEX IF NOT EXISTS idx_menu_permission_employee_id ON erp.menu_permission(employee_id);

-- 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_permission TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_permission TO service_role;

-- 초기 데이터는 필요 없음 (직원별로 개별 설정)
-- 관리자(role_id: 1)인 직원들은 모든 메뉴에 접근 가능하도록 코드에서 처리

-- 주석
COMMENT ON TABLE erp.menu_permission IS '메뉴별 직원 접근 권한 관리';
COMMENT ON COLUMN erp.menu_permission.menu_key IS '메뉴 식별자 (navigation.ts의 href 기반)';
COMMENT ON COLUMN erp.menu_permission.employee_id IS '직원 ID';
COMMENT ON COLUMN erp.menu_permission.allowed IS '접근 허용 여부';

