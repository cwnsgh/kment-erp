-- 거래처 테이블에 우편번호(postal_code) 필드 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE erp.client
ADD COLUMN IF NOT EXISTS postal_code text;

COMMENT ON COLUMN erp.client.postal_code IS '우편번호';

