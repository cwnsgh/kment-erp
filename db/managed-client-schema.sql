-- 관리상품(관리고객) 관리 스키마
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 관리상품(관리고객) 메인 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS erp.managed_client (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES erp.client(id) ON DELETE CASCADE NOT NULL, -- 거래처 ID
  product_type1 text NOT NULL, -- 'deduct' (금액차감형) 또는 'maintenance' (유지보수형)
  product_type2 text, -- 금액차감형: '3m', '6m', '9m', '12m' / 유지보수형: 'standard', 'premium'
  total_amount numeric, -- 총 금액 (금액차감형만)
  payment_status text NOT NULL, -- 'paid' (완납), 'prepaid' (선납), 'unpaid' (미납)
  start_date timestamptz, -- 시작일 (시작 버튼을 누르면 설정됨)
  end_date timestamptz, -- 종료일 (시작일 기준으로 계산)
  status text DEFAULT 'wait', -- 'wait' (대기), 'ongoing' (진행), 'end' (종료), 'unpaid' (미납)
  -- 유지보수형 세부 내용
  detail_text_edit_count integer, -- 영역 텍스트 수정 횟수
  detail_coding_edit_count integer, -- 코딩 수정 횟수
  detail_image_edit_count integer, -- 기존 결과물 이미지 수정 횟수
  detail_popup_design_count integer, -- 팝업 디자인 횟수
  detail_banner_design_count integer, -- 신규 배너 디자인 횟수 (프리미엄만)
  note text, -- 비고
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_managed_client_client_id ON erp.managed_client(client_id);
CREATE INDEX IF NOT EXISTS idx_managed_client_product_type1 ON erp.managed_client(product_type1);
CREATE INDEX IF NOT EXISTS idx_managed_client_payment_status ON erp.managed_client(payment_status);
CREATE INDEX IF NOT EXISTS idx_managed_client_status ON erp.managed_client(status);
CREATE INDEX IF NOT EXISTS idx_managed_client_start_date ON erp.managed_client(start_date);

-- ============================================
-- updated_at 자동 업데이트 트리거
-- ============================================

CREATE OR REPLACE FUNCTION erp.update_managed_client_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_managed_client_updated_at
  BEFORE UPDATE ON erp.managed_client
  FOR EACH ROW
  EXECUTE FUNCTION erp.update_managed_client_updated_at();

-- ============================================
-- 권한 설정
-- ============================================

-- anon 역할에 권한 부여
GRANT ALL ON TABLE erp.managed_client TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA erp TO anon;

-- authenticated 역할에 권한 부여
GRANT ALL ON TABLE erp.managed_client TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA erp TO authenticated;

-- service_role에 권한 부여
GRANT ALL ON TABLE erp.managed_client TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA erp TO service_role;
