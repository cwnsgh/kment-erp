-- 계약 업무 승인 요청 테이블 (계약 불러오기 → 업무 등록 → 클라이언트 승인 → 작업내용 횟수 차감)
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 계약 업무 요청 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS erp.contract_work_request (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id uuid REFERENCES erp.contract(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES erp.client(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES erp.employee(id) ON DELETE SET NULL,
  contract_work_content_id uuid REFERENCES erp.contract_work_content(id) ON DELETE SET NULL,
  brand_name text NOT NULL,
  manager text NOT NULL,
  work_period date,
  attachment_url text,
  attachment_name text,
  work_content text,
  memo text,
  status text DEFAULT 'pending',
  rejection_reason text,
  approved_at timestamptz,
  approved_by uuid REFERENCES erp.client(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_work_request_contract_id ON erp.contract_work_request(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_work_request_client_id ON erp.contract_work_request(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_work_request_status ON erp.contract_work_request(status);
CREATE INDEX IF NOT EXISTS idx_contract_work_request_created_at ON erp.contract_work_request(created_at);

CREATE OR REPLACE FUNCTION update_contract_work_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contract_work_request_updated_at ON erp.contract_work_request;
CREATE TRIGGER trigger_update_contract_work_request_updated_at
  BEFORE UPDATE ON erp.contract_work_request
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_work_request_updated_at();

GRANT ALL ON TABLE erp.contract_work_request TO anon;
GRANT ALL ON TABLE erp.contract_work_request TO authenticated;
GRANT ALL ON TABLE erp.contract_work_request TO service_role;
