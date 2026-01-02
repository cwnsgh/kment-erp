-- managed_client 테이블에 누락된 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- start_date 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erp' 
    AND table_name = 'managed_client' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE erp.managed_client ADD COLUMN start_date timestamptz;
  END IF;
END $$;

-- end_date 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erp' 
    AND table_name = 'managed_client' 
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE erp.managed_client ADD COLUMN end_date timestamptz;
  END IF;
END $$;

-- status 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erp' 
    AND table_name = 'managed_client' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE erp.managed_client ADD COLUMN status text DEFAULT 'wait';
  END IF;
END $$;

-- 기존 데이터의 status 업데이트 (payment_status 기준으로 계산)
-- start_date와 end_date가 없을 수 있으므로 안전하게 처리
UPDATE erp.managed_client
SET status = CASE
  WHEN payment_status = 'unpaid' THEN 'unpaid'
  WHEN start_date IS NULL THEN 'wait'
  WHEN end_date IS NOT NULL AND end_date < now() THEN 'end'
  WHEN product_type1 = 'deduct' AND total_amount IS NOT NULL AND total_amount = 0 THEN 'end'
  WHEN start_date IS NOT NULL THEN 'ongoing'
  ELSE 'wait'
END
WHERE status IS NULL OR status = 'wait';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_managed_client_status ON erp.managed_client(status);
CREATE INDEX IF NOT EXISTS idx_managed_client_start_date ON erp.managed_client(start_date);

