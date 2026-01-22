-- 검색 성능 개선용 인덱스 (ILIKE 최적화)
-- Supabase SQL Editor에서 실행하세요

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_client_name_trgm
  ON erp.client USING gin (name gin_trgm_ops);


