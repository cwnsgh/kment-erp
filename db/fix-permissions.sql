-- erp 스키마 권한 수정
-- Supabase SQL Editor에서 실행하세요

-- 1. anon 역할에 erp 스키마 사용 권한 부여
GRANT USAGE ON SCHEMA erp TO anon;
GRANT ALL ON SCHEMA erp TO anon;

-- 2. authenticated 역할에 erp 스키마 사용 권한 부여 (이미 있을 수 있음)
GRANT USAGE ON SCHEMA erp TO authenticated;
GRANT ALL ON SCHEMA erp TO authenticated;

-- 3. service_role에 erp 스키마 사용 권한 부여
GRANT USAGE ON SCHEMA erp TO service_role;
GRANT ALL ON SCHEMA erp TO service_role;

-- 4. 모든 테이블에 대한 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA erp TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA erp TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA erp TO service_role;

-- 5. 모든 시퀀스에 대한 권한 부여 (필요한 경우)
GRANT ALL ON ALL SEQUENCES IN SCHEMA erp TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA erp TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA erp TO service_role;

-- 6. 앞으로 생성될 테이블에 대한 기본 권한 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT ALL ON SEQUENCES TO service_role;







