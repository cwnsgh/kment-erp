-- 간단한 테스트용 직원 계정 생성 (login_id 필드 없이도 작동)
-- Supabase SQL Editor에서 실행하세요
--
-- 이 스크립트는 login_id 필드가 없어도 작동합니다.
-- 이메일로만 로그인 가능합니다.

-- ============================================
-- 1단계: 역할 확인 (employee-schema.sql 먼저 실행 필요)
-- ============================================
SELECT id, level, name FROM erp.role ORDER BY level;

-- ============================================
-- 2단계: 관리자 계정 생성 (이메일만 사용)
-- 이메일: admin@kment.co.kr
-- 비밀번호: admin123
-- ============================================
INSERT INTO erp.employee (email, password_hash, name, phone, role_id, is_active)
VALUES (
  'admin@kment.co.kr',
  '$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy',
  '관리자',
  '010-1234-5678',
  (SELECT id FROM erp.role WHERE level = 1 LIMIT 1),
  true
)
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role_id = EXCLUDED.role_id,
  is_active = true,
  updated_at = now();

-- ============================================
-- 3단계: 생성 확인
-- ============================================
SELECT 
  e.id,
  e.email,
  e.name,
  e.phone,
  r.name as role_name,
  r.level as role_level,
  e.is_active
FROM erp.employee e
LEFT JOIN erp.role r ON e.role_id = r.id
WHERE e.email = 'admin@kment.co.kr';

-- ============================================
-- 모든 직원 계정 확인
-- ============================================
SELECT 
  e.id,
  e.email,
  e.name,
  e.phone,
  r.name as role_name,
  r.level as role_level,
  e.is_active,
  e.created_at
FROM erp.employee e
LEFT JOIN erp.role r ON e.role_id = r.id
ORDER BY r.level, e.created_at;

