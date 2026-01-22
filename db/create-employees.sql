-- 직원 계정 일괄 생성 SQL
-- Supabase SQL Editor에서 실행하세요
--
-- 사용 전 확인사항:
-- 1. employee-schema.sql 실행 완료
-- 2. add-employee-login-id.sql 실행 완료 (login_id 필드 필요)
-- 3. role 테이블에 역할 데이터가 있어야 함

-- ============================================
-- 1단계: 역할 확인
-- ============================================
-- 먼저 역할 ID를 확인하세요
SELECT id, level, name FROM erp.role ORDER BY level;

-- ============================================
-- 2단계: 직원 계정 생성
-- ============================================
-- 아래 예시를 참고하여 직원 정보를 수정하세요

-- 예시 1: 단일 직원 생성
INSERT INTO erp.employee (login_id, email, password_hash, name, phone, role_id, is_active)
VALUES (
  'honggildong',                    -- login_id (로그인 아이디)
  'hong@kment.co.kr',               -- email
  '$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy',  -- 비밀번호: password123 (해시값)
  '홍길동',                          -- name
  '010-1234-5678',                  -- phone
  (SELECT id FROM erp.role WHERE level = 3 LIMIT 1),  -- role_id (3=대리)
  true                               -- is_active
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
-- 예시 2: 여러 직원 한번에 생성 (배치 INSERT)
-- ============================================
INSERT INTO erp.employee (login_id, email, password_hash, name, phone, role_id, is_active)
VALUES 
  -- 직원 1: 과장
  (
    'kimmanager',
    'kim@kment.co.kr',
    '$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy',  -- password123
    '김과장',
    '010-1111-2222',
    (SELECT id FROM erp.role WHERE level = 2 LIMIT 1),  -- 과장
    true
  ),
  -- 직원 2: 대리
  (
    'leedeputy',
    'lee@kment.co.kr',
    '$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy',  -- password123
    '이대리',
    '010-2222-3333',
    (SELECT id FROM erp.role WHERE level = 3 LIMIT 1),  -- 대리
    true
  ),
  -- 직원 3: 주임
  (
    'parkjunior',
    'park@kment.co.kr',
    '$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy',  -- password123
    '박주임',
    '010-3333-4444',
    (SELECT id FROM erp.role WHERE level = 4 LIMIT 1),  -- 주임
    true
  ),
  -- 직원 4: 프로
  (
    'choipro',
    'choi@kment.co.kr',
    '$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy',  -- password123
    '최프로',
    '010-4444-5555',
    (SELECT id FROM erp.role WHERE level = 5 LIMIT 1),  -- 프로
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
-- 예시 3: 이메일만 있는 경우 (login_id 자동 생성)
-- ============================================
-- 이메일에서 @ 앞부분을 login_id로 사용
INSERT INTO erp.employee (login_id, email, password_hash, name, phone, role_id, is_active)
VALUES (
  SPLIT_PART('newemployee@kment.co.kr', '@', 1),  -- 이메일에서 login_id 자동 추출
  'newemployee@kment.co.kr',
  '$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy',
  '신입사원',
  '010-5555-6666',
  (SELECT id FROM erp.role WHERE level = 5 LIMIT 1),
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
-- 모든 직원 목록 조회
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

-- ============================================
-- 4단계: 특정 직원 확인
-- ============================================
-- 특정 login_id로 검색
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
WHERE e.login_id = 'honggildong';  -- 검색할 login_id

-- ============================================
-- 5단계: 비밀번호 변경 (필요시)
-- ============================================
-- 주의: 비밀번호 해시는 bcrypt로 생성해야 합니다
-- 아래 해시값은 'newpassword123'의 예시입니다
-- 실제로는 Node.js 스크립트나 온라인 bcrypt 생성기를 사용하세요
UPDATE erp.employee
SET 
  password_hash = '$2a$10$새로운해시값을여기에입력',
  updated_at = now()
WHERE login_id = 'honggildong';

-- ============================================
-- 6단계: 직원 비활성화 (삭제 대신)
-- ============================================
UPDATE erp.employee
SET 
  is_active = false,
  updated_at = now()
WHERE login_id = 'honggildong';

-- ============================================
-- 7단계: 직원 삭제 (주의: 실제 삭제)
-- ============================================
-- DELETE FROM erp.employee WHERE login_id = 'honggildong';

-- ============================================
-- 실제 직원 계정 생성 (2024년)
-- ============================================
-- ⚠️ 중요: 이 SQL을 실행하기 전에 먼저 add-employee-login-id.sql을 실행해야 합니다!
-- login_id 필드가 없으면 아래 오류가 발생합니다: column "login_id" does not exist
--
-- 해결 방법:
-- 1. 먼저 db/add-employee-login-id.sql 파일을 Supabase SQL Editor에서 실행하세요
-- 2. 그 다음 아래 SQL을 실행하세요

INSERT INTO erp.employee (login_id, email, password_hash, name, phone, role_id, is_active)
VALUES 
  -- 직원 1: 김주영 (주임)
  (
    'juyoung0145',
    'juyoung0145@kmentcorp.co.kr',
    '$2a$10$2jnhmH.exnH6rb471LTIf.GuvIY7w4FfOH6iZ2fyKyR8kK3M6ceRa',  -- 비밀번호: 123123
    '김주영',
    '010-7118-5906',
    (SELECT id FROM erp.role WHERE level = 4 LIMIT 1),  -- 주임 (레벨 4)
    true
  ),
  -- 직원 2: 이다은 (프로)
  (
    'intro2eun',
    'intro2eun@kmentcorp.co.kr',
    '$2a$10$KFz2f5TaIcNck.TsU46/XuDl7Tn01zUycn9YZb57ZhbczvhUIsHKO',  -- 비밀번호: ekdmswhdqhr@
    '이다은',
    '010-8461-0045',
    (SELECT id FROM erp.role WHERE level = 5 LIMIT 1),  -- 프로 (레벨 5)
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

-- 생성 확인
SELECT 
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
WHERE e.login_id IN ('juyoung0145', 'intro2eun')
ORDER BY r.level;

