-- 직원 계정 생성 SQL
-- Supabase SQL Editor에서 실행하세요
--
-- ✅ 현재 DB 스키마에는 employee.login_id 컬럼이 없을 수 있으므로,
--    login_id를 쓰지 않고 기존 employee.email 컬럼에 "로그인 아이디" 값을 그대로 저장합니다.
--    (즉, email 컬럼이 실제 이메일이 아니라 로그인 아이디 역할을 하게 됩니다.)
--
-- 생성할 직원:
-- 1. 김선규 - 과장 (ksk4652)
-- 2. 장준혁 - 대리 (groove93)

-- ============================================
-- 직원 계정 생성
-- ============================================
INSERT INTO erp.employee (email, password_hash, name, phone, role_id, is_active)
VALUES 
  -- 직원 1: 김선규 (과장)
  (
    'ksk4652',
    '$2a$10$ylDcQy/vtOtaILV9TrNeL.gXGTOjYEorQf.QY/lgde5al3qjzoOBq',  -- 비밀번호: tjsrb46521!
    '김선규',
    '010-2080-4262',
    (SELECT id FROM erp.role WHERE level = 2 LIMIT 1),  -- 과장 (레벨 2)
    true
  ),
  -- 직원 2: 장준혁 (대리)
  (
    'groove93',
    '$2a$10$pe9eZhj91rKYpVnvttn9hebqM9HIVS12A6Jw9TvPb0wgszE.ru.SO',  -- 비밀번호: 123
    '장준혁',
    '010-7553-5490',
    (SELECT id FROM erp.role WHERE level = 3 LIMIT 1),  -- 대리 (레벨 3)
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
-- 생성 확인
-- ============================================
SELECT 
  e.email,
  e.name,
  e.phone,
  r.name as role_name,
  r.level as role_level,
  e.is_active,
  e.created_at
FROM erp.employee e
LEFT JOIN erp.role r ON e.role_id = r.id
WHERE e.email IN ('ksk4652', 'groove93')
ORDER BY r.level;

