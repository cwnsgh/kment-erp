-- 직원 관리 확장 컬럼 추가
-- 기존 직원 데이터는 삭제하지 않으며, 부족한 필드만 추가합니다.
-- Supabase SQL Editor에서 실행하세요.

-- ============================================
-- 1. employee 테이블 컬럼 추가
-- ============================================

-- 로그인 아이디 (아이디로 로그인 시 사용, add-employee-login-id.sql 미적용 시 필요)
ALTER TABLE erp.employee ADD COLUMN IF NOT EXISTS login_id text;

-- 담당 업무 (디자인, 퍼블리싱, 개발, 마케팅 등)
ALTER TABLE erp.employee ADD COLUMN IF NOT EXISTS job_type text;

-- 연락용 이메일 (실제 이메일 주소, email 컬럼은 로그인 ID로도 사용 가능)
ALTER TABLE erp.employee ADD COLUMN IF NOT EXISTS contact_email text;

-- 생년월일
ALTER TABLE erp.employee ADD COLUMN IF NOT EXISTS birth_date date;

-- 입사일
ALTER TABLE erp.employee ADD COLUMN IF NOT EXISTS join_date date;

-- 퇴사일
ALTER TABLE erp.employee ADD COLUMN IF NOT EXISTS leave_date date;

-- 재직 상태: 'employed'(재직), 'on_leave'(휴직), 'left'(퇴사)
ALTER TABLE erp.employee ADD COLUMN IF NOT EXISTS employment_status text DEFAULT 'employed';

-- 퇴사 사유
ALTER TABLE erp.employee ADD COLUMN IF NOT EXISTS leave_reason text;

-- 관리자 메모 (권한 있는 사용자만 조회/수정)
ALTER TABLE erp.employee ADD COLUMN IF NOT EXISTS admin_memo text;

-- profile_image_url은 employee-schema.sql에 이미 정의되어 있음 (없으면 추가)
ALTER TABLE erp.employee ADD COLUMN IF NOT EXISTS profile_image_url text;

-- ============================================
-- 2. 관리자 메모 보기 권한용 메뉴 키 (선택 사항)
--    메뉴 권한 관리에서 "직원 관리자 메모 보기"를 특정 직원에게 부여할 수 있음
-- ============================================
INSERT INTO erp.menu_structure (category_key, category_name, menu_key, menu_name, navigation_path, display_order)
VALUES ('staff', '직원관리', 'staff-admin-memo', '직원 관리자 메모 보기', '/staff', 9)
ON CONFLICT (category_key, menu_key) DO NOTHING;

-- ============================================
-- 3. 인덱스 (검색/필터용)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_employee_employment_status ON erp.employee(employment_status) WHERE employment_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employee_join_date ON erp.employee(join_date) WHERE join_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employee_job_type ON erp.employee(job_type) WHERE job_type IS NOT NULL;
