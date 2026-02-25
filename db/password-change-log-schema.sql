-- 비밀번호 변경 이력 테이블 (누가, 언제, 어떤 대상의 비밀번호를 변경했는지)
-- Supabase SQL Editor에서 실행하세요.
--
-- 로그 조회 (이름 포함):
--   SELECT * FROM erp.password_change_log_view LIMIT 100;
-- 로그 조회 (원본 테이블):
--   SELECT * FROM erp.password_change_log ORDER BY created_at DESC LIMIT 100;

CREATE TABLE IF NOT EXISTS erp.password_change_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now() NOT NULL,

  -- 누가 변경했는지
  actor_type text NOT NULL, -- 'employee_self' | 'client_self' | 'employee_for_client'
  actor_employee_id uuid REFERENCES erp.employee(id) ON DELETE SET NULL,
  actor_client_id uuid REFERENCES erp.client(id) ON DELETE SET NULL,

  -- 어떤 대상의 비밀번호인지
  target_type text NOT NULL, -- 'employee' | 'client'
  target_employee_id uuid REFERENCES erp.employee(id) ON DELETE SET NULL,
  target_client_id uuid REFERENCES erp.client(id) ON DELETE SET NULL
);

COMMENT ON TABLE erp.password_change_log IS '비밀번호 변경 이력 (감사용)';
COMMENT ON COLUMN erp.password_change_log.actor_type IS 'employee_self: 직원 본인 변경, client_self: 거래처 본인 변경, employee_for_client: 직원이 거래처 비밀번호 변경';
COMMENT ON COLUMN erp.password_change_log.target_type IS '대상: employee(직원), client(거래처)';

CREATE INDEX IF NOT EXISTS idx_password_change_log_created_at ON erp.password_change_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_change_log_actor_employee ON erp.password_change_log(actor_employee_id) WHERE actor_employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_password_change_log_actor_client ON erp.password_change_log(actor_client_id) WHERE actor_client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_password_change_log_target_employee ON erp.password_change_log(target_employee_id) WHERE target_employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_password_change_log_target_client ON erp.password_change_log(target_client_id) WHERE target_client_id IS NOT NULL;

-- 로그 조회용 뷰 (누가 / 대상 이름 포함)
-- employee는 email 사용 (login_id는 add-employee-login-id.sql 적용 시에만 있음)
CREATE OR REPLACE VIEW erp.password_change_log_view AS
SELECT
  pcl.id,
  pcl.created_at,
  pcl.actor_type,
  pcl.target_type,
  e_actor.name AS actor_employee_name,
  e_actor.email AS actor_employee_login_id,
  c_actor.name AS actor_client_name,
  c_actor.login_id AS actor_client_login_id,
  e_target.name AS target_employee_name,
  c_target.name AS target_client_name
FROM erp.password_change_log pcl
LEFT JOIN erp.employee e_actor ON e_actor.id = pcl.actor_employee_id
LEFT JOIN erp.client c_actor ON c_actor.id = pcl.actor_client_id
LEFT JOIN erp.employee e_target ON e_target.id = pcl.target_employee_id
LEFT JOIN erp.client c_target ON c_target.id = pcl.target_client_id;

-- 권한: 앱(anon/authenticated)이 로그 조회·기록 가능하도록
GRANT SELECT, INSERT ON erp.password_change_log TO anon;
GRANT SELECT, INSERT ON erp.password_change_log TO authenticated;
GRANT ALL ON erp.password_change_log TO service_role;
GRANT SELECT ON erp.password_change_log_view TO anon;
GRANT SELECT ON erp.password_change_log_view TO authenticated;
GRANT SELECT ON erp.password_change_log_view TO service_role;
