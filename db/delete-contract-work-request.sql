-- 계약 업무 요청 삭제: 승인된 경우 modification_count 복구 후 status = 'deleted'
-- Supabase SQL Editor에서 실행하세요

CREATE OR REPLACE FUNCTION erp.delete_contract_work_request(
  p_request_id uuid
)
RETURNS TABLE (success boolean, error text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_req record;
BEGIN
  SELECT * INTO v_req
  FROM erp.contract_work_request
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '업무 요청을 찾을 수 없습니다.'::text;
    RETURN;
  END IF;

  IF v_req.status = 'approved' AND v_req.contract_work_content_id IS NOT NULL THEN
    UPDATE erp.contract_work_content
    SET modification_count = modification_count + 1,
        updated_at = now()
    WHERE id = v_req.contract_work_content_id;
  END IF;

  UPDATE erp.contract_work_request
  SET status = 'deleted',
      updated_at = now()
  WHERE id = p_request_id;

  RETURN QUERY SELECT true, null::text;
END;
$$;
