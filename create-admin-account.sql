-- 관리자 계정 생성 SQL
-- 이메일: kment@kmentcorp.co.kr

-- 1. 먼저 관리자 역할(role)의 ID를 확인합니다
-- 보통 level 1이 사장(관리자)입니다
SELECT id, level, name 
FROM erp.role 
WHERE level = 1 OR name LIKE '%관리자%' OR name LIKE '%사장%'
ORDER BY level ASC
LIMIT 1;

-- 2. 위 쿼리 결과에서 role_id를 확인한 후 아래 INSERT 문을 실행하세요
-- 비밀번호 해시는 bcrypt로 생성해야 합니다 (예: 'admin123' -> '$2a$10$...')
-- 
-- 비밀번호 해시 생성 방법:
-- 1) Node.js에서: const bcrypt = require('bcryptjs'); bcrypt.hash('원하는비밀번호', 10)
-- 2) 온라인 도구 사용: https://bcrypt-generator.com/
-- 3) 또는 아래 예시 해시 사용 (비밀번호: 'admin123')

-- 비밀번호: 'admin123'에 대한 bcrypt 해시
-- 다른 비밀번호를 사용하려면 위의 방법으로 해시를 생성하세요
INSERT INTO erp.employee (
  email,
  password_hash,
  name,
  role_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'kment@kmentcorp.co.kr',
  '$2a$10$rUaf1erPh6oE1ipiYtIvCegFTO7WukXQnkH8kkuutt5DHnioxyyLC',  -- 비밀번호: 'admin123'
  '대표이사',
  (SELECT id FROM erp.role WHERE level = 1 OR name LIKE '%관리자%' OR name LIKE '%사장%' ORDER BY level ASC LIMIT 1),  -- 관리자 역할 ID
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role_id = EXCLUDED.role_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3. 생성된 계정 확인
SELECT 
  e.id,
  e.email,
  e.name,
  e.is_active,
  r.name as role_name,
  r.level as role_level
FROM erp.employee e
LEFT JOIN erp.role r ON e.role_id = r.id
WHERE e.email = 'kment@kmentcorp.co.kr';

