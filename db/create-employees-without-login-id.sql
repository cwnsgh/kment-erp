-- 직원 계정 생성 (login_id 필드 없이)
-- ⚠️ 이 SQL은 login_id 필드가 없는 경우 사용하세요
-- email만 사용하여 계정을 생성합니다

-- ============================================
-- 실제 직원 계정 생성 (2024년)
-- ============================================
-- login_id 필드가 없는 경우 이 SQL을 사용하세요
-- email을 로그인 ID로 사용합니다

INSERT INTO erp.employee (email, password_hash, name, phone, role_id, is_active)
VALUES 
  -- 직원 1: 김주영 (주임)
  (
    'juyoung0145@kmentcorp.co.kr',
    '$2a$10$2jnhmH.exnH6rb471LTIf.GuvIY7w4FfOH6iZ2fyKyR8kK3M6ceRa',  -- 비밀번호: 123123
    '김주영',
    '010-7118-5906',
    (SELECT id FROM erp.role WHERE level = 4 LIMIT 1),  -- 주임 (레벨 4)
    true
  ),
  -- 직원 2: 이다은 (프로)
  (
    'intro2eun@kmentcorp.co.kr',
    '$2a$10$KFz2f5TaIcNck.TsU46/XuDl7Tn01zUycn9YZb57ZhbczvhUIsHKO',  -- 비밀번호: ekdmswhdqhr@
    '이다은',
    '010-8461-0045',
    (SELECT id FROM erp.role WHERE level = 5 LIMIT 1),  -- 프로 (레벨 5)
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

-- 생성 확인
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
WHERE e.email IN ('juyoung0145@kmentcorp.co.kr', 'intro2eun@kmentcorp.co.kr')
ORDER BY r.level;

