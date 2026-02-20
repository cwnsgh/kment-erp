-- 계약 업무 요청 승인: contract_work_content.modification_count 1 차감 후 status = 'approved'
-- Supabase SQL Editor에서 실행하세요

CREATE OR REPLACE FUNCTION erp.approve_contract_work_request(
  p_request_id uuid,
  p_client_id uuid
)
RETURNS TABLE (success boolean, error text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_req record;
  v_count int;
BEGIN
  SELECT * INTO v_req
  FROM erp.contract_work_request
  WHERE id = p_request_id AND client_id = p_client_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '업무 요청을 찾을 수 없습니다.'::text;
    RETURN;
  END IF;

  IF v_req.status <> 'pending' THEN
    RETURN QUERY SELECT false, '승인 대기 중인 요청만 승인할 수 있습니다.'::text;
    RETURN;
  END IF;

  IF v_req.contract_work_content_id IS NOT NULL THEN
    SELECT modification_count INTO v_count
    FROM erp.contract_work_content
    WHERE id = v_req.contract_work_content_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT false, '계약 작업 내용을 찾을 수 없습니다.'::text;
      RETURN;
    END IF;
    IF v_count IS NULL OR v_count < 1 THEN
      RETURN QUERY SELECT false, '수정 횟수가 부족합니다.'::text;
      RETURN;
    END IF;

    UPDATE erp.contract_work_content
    SET modification_count = modification_count - 1,
        updated_at = now()
    WHERE id = v_req.contract_work_content_id;
  END IF;

  UPDATE erp.contract_work_request
  SET status = 'approved',
      approved_at = now(),
      approved_by = p_client_id,
      updated_at = now()
  WHERE id = p_request_id;

  RETURN QUERY SELECT true, null::text;
END;
$$;
