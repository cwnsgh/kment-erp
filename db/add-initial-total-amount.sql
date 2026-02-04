-- 관리상품 초기세팅금액 필드 추가 및 마이그레이션
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- initial_total_amount 컬럼 추가
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erp' 
    AND table_name = 'managed_client' 
    AND column_name = 'initial_total_amount'
  ) THEN
    ALTER TABLE erp.managed_client ADD COLUMN initial_total_amount numeric;
  END IF;
END $$;

-- ============================================
-- 기존 데이터 마이그레이션 (역산 계산)
-- ============================================

-- 금액차감형 데이터의 initial_total_amount 계산
-- 초기세팅금액 = 현재 total_amount + 승인된 요청들의 approval_deducted_amount 합계
UPDATE erp.managed_client mc
SET initial_total_amount = 
  COALESCE(mc.total_amount, 0) + 
  COALESCE((
    SELECT SUM(COALESCE(wr.approval_deducted_amount, 0))
    FROM erp.work_request wr
    WHERE wr.managed_client_id = mc.id
      AND wr.work_type = 'deduct'
      AND wr.status IN ('approved', 'in_progress', 'completed')
      AND wr.status != 'deleted'
      AND wr.approval_deducted_amount IS NOT NULL
      AND wr.approval_deducted_amount > 0
  ), 0)
WHERE mc.product_type1 = 'deduct'
  AND mc.initial_total_amount IS NULL;

-- 승인된 요청이 없거나 approval_deducted_amount가 NULL인 경우
-- 현재 total_amount를 초기값으로 설정
UPDATE erp.managed_client mc
SET initial_total_amount = COALESCE(mc.total_amount, 0)
WHERE mc.product_type1 = 'deduct'
  AND mc.initial_total_amount IS NULL;

-- ============================================
-- 데이터 검증 (선택사항 - 실행 후 확인)
-- ============================================

-- 검증 쿼리: initial_total_amount가 total_amount보다 작은 경우 확인
-- SELECT 
--   id, 
--   total_amount, 
--   initial_total_amount,
--   (initial_total_amount - COALESCE(total_amount, 0)) as 사용금액_계산값
-- FROM erp.managed_client
-- WHERE product_type1 = 'deduct'
--   AND initial_total_amount IS NOT NULL
--   AND total_amount IS NOT NULL
--   AND initial_total_amount < total_amount
-- ORDER BY created_at DESC;

-- ============================================
-- 인덱스 생성 (선택사항)
-- ============================================

-- CREATE INDEX IF NOT EXISTS idx_managed_client_initial_total_amount 
-- ON erp.managed_client(initial_total_amount) 
-- WHERE initial_total_amount IS NOT NULL;
