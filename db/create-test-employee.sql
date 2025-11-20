-- 임시 테스트용 직원 계정 생성
-- Supabase SQL Editor에서 실행하세요
--
-- 주의: add-employee-login-id.sql을 먼저 실행해야 login_id 필드가 추가됩니다.

-- ============================================
-- 1단계: 역할 확인 (employee-schema.sql 먼저 실행 필요)
-- ============================================
SELECT id, level, name FROM erp.role ORDER BY level;

-- ============================================
-- 2단계: 관리자 계정 생성
-- 로그인 ID: admin
-- 이메일: admin@kment.co.kr (선택사항)
-- 비밀번호: admin123
-- ============================================
INSERT INTO erp.employee (login_id, email, password_hash, name, phone, role_id, is_active)
VALUES (
  'admin',
  'admin@kment.co.kr',
  '$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy',
  '관리자',
  '010-1234-5678',
  (SELECT id FROM erp.role WHERE level = 1 LIMIT 1),
  true
)
ON CONFLICT (login_id) DO UPDATE
SET 
  email = EXCLUDED.email,
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
  e.login_id,
  e.email,
  e.name,
  e.phone,
  r.name as role_name,
  r.level as role_level,
  e.is_active
FROM erp.employee e
LEFT JOIN erp.role r ON e.role_id = r.id
WHERE e.login_id = 'admin';

-- ============================================
-- 추가 계정 (선택사항 - 필요시 주석 해제)
-- ============================================

-- 과장 계정
-- INSERT INTO erp.employee (login_id, email, password_hash, name, phone, role_id, is_active)
-- VALUES (
--   'manager',
--   'manager@kment.co.kr',
--   '$2a$10$MZJxU6NsXr4b361itr9qHuQecMMCiiul7uDjTto3J43hfpHTNpktS',
--   '과장',
--   '010-2345-6789',
--   (SELECT id FROM erp.role WHERE level = 2 LIMIT 1),
--   true
-- )
-- ON CONFLICT (login_id) DO UPDATE
-- SET 
--   email = EXCLUDED.email,
--   password_hash = EXCLUDED.password_hash,
--   name = EXCLUDED.name,
--   phone = EXCLUDED.phone,
--   role_id = EXCLUDED.role_id,
--   is_active = true,
--   updated_at = now();

-- 직원 계정
-- INSERT INTO erp.employee (login_id, email, password_hash, name, phone, role_id, is_active)
-- VALUES (
--   'staff',
--   'staff@kment.co.kr',
--   '$2a$10$JXOuv3ispyes00NmoflkOOVdnZ9hmHmMGAhGHJ0qPBqOE1IPo3DT.',
--   '직원',
--   '010-3456-7890',
--   (SELECT id FROM erp.role WHERE level = 3 LIMIT 1),
--   true
-- )
-- ON CONFLICT (login_id) DO UPDATE
-- SET 
--   email = EXCLUDED.email,
--   password_hash = EXCLUDED.password_hash,
--   name = EXCLUDED.name,
--   phone = EXCLUDED.phone,
--   role_id = EXCLUDED.role_id,
--   is_active = true,
--   updated_at = now();

-- ============================================
-- 모든 직원 계정 확인
-- ============================================
SELECT 
  e.id,
  e.login_id,
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
