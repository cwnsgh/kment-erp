-- 성능 개선용 인덱스 추가
-- Supabase SQL Editor에서 실행하세요

-- client
CREATE INDEX IF NOT EXISTS idx_client_business_registration_number
  ON erp.client (business_registration_number);
CREATE INDEX IF NOT EXISTS idx_client_login_id
  ON erp.client (login_id);
CREATE INDEX IF NOT EXISTS idx_client_status
  ON erp.client (status);

-- client_contact / client_attachment / client_site
CREATE INDEX IF NOT EXISTS idx_client_contact_client_id
  ON erp.client_contact (client_id);
CREATE INDEX IF NOT EXISTS idx_client_attachment_client_id
  ON erp.client_attachment (client_id);
CREATE INDEX IF NOT EXISTS idx_client_site_client_id
  ON erp.client_site (client_id);

-- managed_client
CREATE INDEX IF NOT EXISTS idx_managed_client_client_id
  ON erp.managed_client (client_id);
CREATE INDEX IF NOT EXISTS idx_managed_client_status
  ON erp.managed_client (status);
CREATE INDEX IF NOT EXISTS idx_managed_client_start_date
  ON erp.managed_client (start_date);

-- work_request
CREATE INDEX IF NOT EXISTS idx_work_request_client_id
  ON erp.work_request (client_id);
CREATE INDEX IF NOT EXISTS idx_work_request_employee_id
  ON erp.work_request (employee_id);
CREATE INDEX IF NOT EXISTS idx_work_request_status
  ON erp.work_request (status);
CREATE INDEX IF NOT EXISTS idx_work_request_client_status
  ON erp.work_request (client_id, status);

-- notification
CREATE INDEX IF NOT EXISTS idx_notification_client_id
  ON erp.notification (client_id);
CREATE INDEX IF NOT EXISTS idx_notification_employee_id
  ON erp.notification (employee_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read
  ON erp.notification (is_read);
CREATE INDEX IF NOT EXISTS idx_notification_client_unread
  ON erp.notification (client_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notification_employee_unread
  ON erp.notification (employee_id, is_read);

