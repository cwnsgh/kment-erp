-- 업무 승인 요청 및 알림 관리 스키마
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 업무 승인 요청 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS erp.work_request (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  managed_client_id uuid REFERENCES erp.managed_client(id) ON DELETE CASCADE NOT NULL, -- 관리 고객 ID
  client_id uuid REFERENCES erp.client(id) ON DELETE CASCADE NOT NULL, -- 거래처 ID (승인할 클라이언트)
  employee_id uuid REFERENCES erp.employee(id) ON DELETE CASCADE NOT NULL, -- 요청한 직원 (담당자)
  work_type text NOT NULL, -- 'deduct' (금액차감형) 또는 'maintenance' (유지보수형)
  brand_name text NOT NULL, -- 브랜드명
  manager text NOT NULL, -- 담당자명
  work_period date, -- 작업기간
  attachment_url text, -- 첨부파일 URL
  attachment_name text, -- 첨부파일명
  cost numeric, -- 비용 (금액차감형만)
  work_content text, -- 작업내용
  count integer, -- 횟수 (유지보수형만)
  work_type_detail text, -- 작업유형 상세 (유지보수형: 'textEdit', 'codingEdit', 'imageEdit', 'popupDesign', 'bannerDesign')
  status text DEFAULT 'pending', -- 'pending' (대기), 'approved' (승인), 'rejected' (거절)
  rejection_reason text, -- 거절 사유
  approved_at timestamptz, -- 승인/거절 시간
  approved_by uuid REFERENCES erp.client(id), -- 승인/거절한 클라이언트
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 알림 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS erp.notification (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES erp.employee(id) ON DELETE CASCADE NOT NULL, -- 받는 사람 (담당자)
  work_request_id uuid REFERENCES erp.work_request(id) ON DELETE CASCADE, -- 관련 업무 요청
  type text NOT NULL, -- 'work_approved' (승인), 'work_rejected' (거절)
  title text NOT NULL, -- 알림 제목
  message text, -- 알림 내용
  is_read boolean DEFAULT false, -- 읽음 여부
  read_at timestamptz, -- 읽은 시간
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 인덱스 생성
-- ============================================

-- work_request 인덱스
CREATE INDEX IF NOT EXISTS idx_work_request_managed_client_id ON erp.work_request(managed_client_id);
CREATE INDEX IF NOT EXISTS idx_work_request_client_id ON erp.work_request(client_id);
CREATE INDEX IF NOT EXISTS idx_work_request_employee_id ON erp.work_request(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_request_status ON erp.work_request(status);
CREATE INDEX IF NOT EXISTS idx_work_request_created_at ON erp.work_request(created_at);

-- notification 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_employee_id ON erp.notification(employee_id);
CREATE INDEX IF NOT EXISTS idx_notification_work_request_id ON erp.notification(work_request_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON erp.notification(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON erp.notification(created_at);

-- ============================================
-- updated_at 자동 업데이트 트리거
-- ============================================

-- work_request updated_at 트리거
CREATE OR REPLACE FUNCTION erp.update_work_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_request_updated_at
  BEFORE UPDATE ON erp.work_request
  FOR EACH ROW
  EXECUTE FUNCTION erp.update_work_request_updated_at();

-- ============================================
-- 권한 설정
-- ============================================

-- work_request 테이블 권한
GRANT ALL ON TABLE erp.work_request TO anon;
GRANT ALL ON TABLE erp.work_request TO authenticated;
GRANT ALL ON TABLE erp.work_request TO service_role;

-- notification 테이블 권한
GRANT ALL ON TABLE erp.notification TO anon;
GRANT ALL ON TABLE erp.notification TO authenticated;
GRANT ALL ON TABLE erp.notification TO service_role;

-- 시퀀스 권한
GRANT ALL ON ALL SEQUENCES IN SCHEMA erp TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA erp TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA erp TO service_role;





