-- 직원 테이블에 login_id 필드 추가
-- Supabase SQL Editor에서 실행하세요
-- 
-- 이 스크립트는 직원도 아이디로 로그인할 수 있도록 합니다.
-- 기존 이메일 기반 로그인도 계속 지원합니다 (하위 호환성)

-- ============================================
-- 1. login_id 필드 추가
-- ============================================
ALTER TABLE erp.employee 
ADD COLUMN IF NOT EXISTS login_id text;

-- ============================================
-- 2. login_id에 UNIQUE 제약 조건 추가
-- ============================================
-- 중복된 login_id가 없는지 확인 후 제약 조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employee_login_id_key'
  ) THEN
    CREATE UNIQUE INDEX employee_login_id_key ON erp.employee(login_id) 
    WHERE login_id IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 3. 기존 이메일을 login_id로 복사 (선택사항)
-- ============================================
-- 기존 직원들의 이메일을 login_id로 복사
-- 이메일에서 @ 앞부분만 추출하여 login_id로 사용
UPDATE erp.employee 
SET login_id = SPLIT_PART(email, '@', 1)
WHERE login_id IS NULL AND email IS NOT NULL;

-- ============================================
-- 4. 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_employee_login_id ON erp.employee(login_id) 
WHERE login_id IS NOT NULL;

-- ============================================
-- 5. 확인
-- ============================================
SELECT 
  id, 
  login_id, 
  email, 
  name, 
  is_active 
FROM erp.employee 
ORDER BY created_at;
