-- 테스트용 직원 계정 생성 스크립트
-- Supabase SQL Editor에서 실행하세요
-- 주의: 실제 운영 환경에서는 이 스크립트를 사용하지 마세요!

-- ============================================
-- 테스트용 직원 계정 생성
-- ============================================

-- 비밀번호 해싱이 필요하므로, Node.js 스크립트를 사용하는 것을 권장합니다.
-- 하지만 테스트용으로 간단한 해시를 직접 입력할 수도 있습니다.

-- 예시: 비밀번호 'password123'의 해시 (bcrypt, 10 rounds)
-- 실제 사용 시에는 아래 스크립트로 해시를 생성하세요:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(hash => console.log(hash));"

-- 테스트용 직원 계정 (비밀번호: password123)
-- 해시: $2a$10$rKJzX9X8Yq5Yq5Yq5Yq5YuJzX9X8Yq5Yq5Yq5Yq5Yq5Yq5Yq5Yq

-- 실제 해시는 아래 Node.js 스크립트를 실행하여 생성하세요:
-- npm run create-test-employee

-- 역할 확인
SELECT id, level, name FROM erp.role ORDER BY level;

-- 테스트용 직원 계정 생성 (비밀번호: password123)
-- 해시는 Node.js 스크립트로 생성하여 사용하세요

-- 예시 (실제 해시 값으로 교체 필요):
-- INSERT INTO erp.employee (email, password_hash, name, phone, role_id, is_active)
-- VALUES 
--   ('admin@kment.co.kr', '$2a$10$...', '관리자', '010-1234-5678', 1, true),
--   ('manager@kment.co.kr', '$2a$10$...', '과장', '010-2345-6789', 2, true),
--   ('staff@kment.co.kr', '$2a$10$...', '직원', '010-3456-7890', 3, true)
-- ON CONFLICT (email) DO NOTHING;

-- 생성된 직원 계정 확인
-- SELECT id, email, name, role_id, is_active FROM erp.employee;






