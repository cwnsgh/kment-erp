-- 계약 관리 스키마
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 계약 메인 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS erp.contract (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES erp.client(id) ON DELETE CASCADE NOT NULL, -- 거래처 ID
  site_id uuid REFERENCES erp.client_site(id) ON DELETE CASCADE NOT NULL, -- 사이트 ID (브랜드명)
  contract_name text NOT NULL, -- 계약명
  contract_date date NOT NULL, -- 계약일
  contract_type_id uuid REFERENCES erp.contract_type(id) ON DELETE RESTRICT NOT NULL, -- 계약 종목 ID
  
  -- 일정 정보
  draft_due_date date, -- 시안 완료 예정일
  demo_due_date date, -- 데모 완료 예정일
  final_completion_date date, -- 최종 완료일
  open_due_date date, -- 오픈 예정일
  
  -- 금액 정보
  contract_amount numeric(15, 2) NOT NULL DEFAULT 0, -- 계약금액
  payment_progress text NOT NULL DEFAULT 'unpaid', -- 납부 진행: 'paid' (완납), 'installment' (분납), 'unpaid' (미납)
  installment_amount numeric(15, 2), -- 분납 금액 (분납인 경우)
  
  -- 비고
  contract_note text, -- 계약 비고
  contract_functionality text, -- 계약 기능성
  work_note text, -- 업무 비고
  
  -- 수정 횟수는 erp.contract_work_content 테이블에서 관리 (동적 작업 내용 지원)
  
  -- 담당자
  primary_contact uuid REFERENCES erp.employee(id) ON DELETE SET NULL NOT NULL, -- 주 담당자 (필수)
  secondary_contact uuid REFERENCES erp.employee(id) ON DELETE SET NULL, -- 부 담당자 (선택)
  
  -- 메타데이터
  created_by uuid REFERENCES erp.employee(id) ON DELETE SET NULL, -- 등록한 직원
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 계약 첨부파일 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS erp.contract_attachment (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id uuid REFERENCES erp.contract(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL, -- 파일 URL (Supabase Storage)
  file_name text NOT NULL, -- 원본 파일명
  file_type text NOT NULL, -- 'contract' (계약서), 'estimate' (견적서)
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contract_client_id ON erp.contract(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_site_id ON erp.contract(site_id);
CREATE INDEX IF NOT EXISTS idx_contract_contract_date ON erp.contract(contract_date);
CREATE INDEX IF NOT EXISTS idx_contract_contract_type_id ON erp.contract(contract_type_id);
CREATE INDEX IF NOT EXISTS idx_contract_payment_progress ON erp.contract(payment_progress);
CREATE INDEX IF NOT EXISTS idx_contract_created_by ON erp.contract(created_by);
CREATE INDEX IF NOT EXISTS idx_contract_attachment_contract_id ON erp.contract_attachment(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_attachment_file_type ON erp.contract_attachment(file_type);

-- ============================================
-- 제약 조건
-- ============================================

-- 계약 종목은 contract_type_id로 관리하므로 제약 조건 제거

-- 납부 진행 제약
ALTER TABLE erp.contract 
  ADD CONSTRAINT check_payment_progress 
  CHECK (payment_progress IN ('paid', 'installment', 'unpaid'));

-- 분납인 경우 분납 금액 필수
ALTER TABLE erp.contract 
  ADD CONSTRAINT check_installment_amount 
  CHECK (
    (payment_progress = 'installment' AND installment_amount IS NOT NULL AND installment_amount > 0) OR
    (payment_progress != 'installment')
  );

-- 첨부파일 타입 제약
ALTER TABLE erp.contract_attachment 
  ADD CONSTRAINT check_file_type 
  CHECK (file_type IN ('contract', 'estimate'));

-- ============================================
-- 업데이트 트리거 (updated_at 자동 갱신)
-- ============================================

CREATE OR REPLACE FUNCTION update_contract_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_updated_at
  BEFORE UPDATE ON erp.contract
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_updated_at();

-- ============================================
-- RLS (Row Level Security) 정책 설정
-- ============================================

-- 개발 단계: RLS 비활성화 (인증 구현 후 활성화 예정)
-- ALTER TABLE erp.contract ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp.contract_attachment ENABLE ROW LEVEL SECURITY;

-- 인증 구현 후 아래 정책들을 활성화하세요:
-- CREATE POLICY "Authenticated users can view contracts" ON erp.contract
--   FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can insert contracts" ON erp.contract
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can update contracts" ON erp.contract
--   FOR UPDATE USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can delete contracts" ON erp.contract
--   FOR DELETE USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can manage contract attachments" ON erp.contract_attachment
--   FOR ALL USING (auth.role() = 'authenticated');
