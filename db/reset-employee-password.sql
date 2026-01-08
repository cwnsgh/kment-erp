-- 직원 비밀번호 재설정 스크립트
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 사용 방법:
-- 1. 아래 SQL에서 이메일과 새 비밀번호를 변경하세요
-- 2. Supabase SQL Editor에서 실행하세요
-- 3. 비밀번호는 자동으로 bcrypt 해시로 변환되어 저장됩니다
-- ============================================

-- 방법 1: 이메일로 비밀번호 재설정
-- 이메일과 새 비밀번호를 변경하세요
DO $$
DECLARE
  target_email text := 'your-email@example.com'; -- 변경할 직원의 이메일
  new_password text := 'newpassword123'; -- 새 비밀번호
  hashed_password text;
BEGIN
  -- bcrypt 해시 생성 (10 rounds)
  -- 주의: Supabase에서는 bcrypt 함수를 직접 사용할 수 없으므로
  -- Node.js에서 해시를 생성한 후 아래에 붙여넣으세요
  
  -- Node.js에서 해시 생성 방법:
  -- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpassword123', 10).then(hash => console.log(hash));"
  
  -- 예시 해시 (비밀번호: 'newpassword123')
  -- 실제 사용 시 위 명령어로 생성한 해시를 사용하세요
  hashed_password := '$2a$10$YourHashedPasswordHere';
  
  -- 비밀번호 업데이트
  UPDATE erp.employee
  SET 
    password_hash = hashed_password,
    updated_at = now()
  WHERE email = target_email;
  
  IF FOUND THEN
    RAISE NOTICE '비밀번호가 성공적으로 변경되었습니다: %', target_email;
  ELSE
    RAISE NOTICE '해당 이메일을 가진 직원을 찾을 수 없습니다: %', target_email;
  END IF;
END $$;

-- ============================================
-- 방법 2: 직접 해시 값으로 업데이트 (권장)
-- ============================================
-- Node.js에서 해시를 생성한 후 아래 SQL을 실행하세요
-- 
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpassword123', 10).then(hash => console.log(hash));"
--
-- 위 명령어 실행 후 나온 해시 값을 아래에 붙여넣으세요

-- UPDATE erp.employee
-- SET 
--   password_hash = '$2a$10$생성된해시값을여기에붙여넣으세요',
--   updated_at = now()
-- WHERE email = 'your-email@example.com';

-- ============================================
-- 방법 3: ID로 비밀번호 재설정
-- ============================================
-- UPDATE erp.employee
-- SET 
--   password_hash = '$2a$10$생성된해시값을여기에붙여넣으세요',
--   updated_at = now()
-- WHERE id = '직원UUID를여기에붙여넣으세요';


