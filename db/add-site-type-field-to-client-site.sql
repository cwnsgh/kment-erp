-- client_site 테이블에 type 필드 추가
-- (이미 추가되어 있을 수 있으므로 IF NOT EXISTS 사용)
ALTER TABLE erp.client_site
ADD COLUMN IF NOT EXISTS type text;

