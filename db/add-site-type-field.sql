-- 사이트 정보에 유형(type) 필드 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE erp.client_site
ADD COLUMN IF NOT EXISTS type text;

COMMENT ON COLUMN erp.client_site.type IS '사이트 유형: 신규, 리뉴얼, 이전, 개발, 유지보수, 기타';



