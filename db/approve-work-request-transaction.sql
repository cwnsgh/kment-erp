-- 업무 승인 처리 (원자적 차감 + 스냅샷 저장)
-- 실행 후 Supabase에 함수가 생성됩니다.

create or replace function erp.approve_work_request(
  p_work_request_id uuid,
  p_client_id uuid
)
returns table (
  success boolean,
  error text,
  work_request_id uuid,
  employee_id uuid
)
language plpgsql
as $$
declare
  v_wr record;
  v_mc record;
  v_deducted numeric;
  v_total numeric;
  v_remaining numeric;
begin
  select *
    into v_wr
    from erp.work_request
   where id = p_work_request_id
     and client_id = p_client_id
   for update;

  if not found then
    return query select false, '업무 요청을 찾을 수 없습니다.', null, null;
    return;
  end if;

  if v_wr.status <> 'pending' then
    return query select false, '승인 대기 중인 업무만 승인할 수 있습니다.', v_wr.id, v_wr.employee_id;
    return;
  end if;

  if v_wr.managed_client_id is not null then
    select *
      into v_mc
      from erp.managed_client
     where id = v_wr.managed_client_id
     for update;
    
    if not found then
      return query select false, '관리 고객 정보를 찾을 수 없습니다.', v_wr.id, v_wr.employee_id;
      return;
    end if;
  end if;

  if v_wr.work_type = 'deduct' and v_wr.cost is not null and v_wr.managed_client_id is not null then
    -- 차감 금액 설정
    v_deducted := v_wr.cost;
    
    -- 현재 총 금액 가져오기 (null이면 0으로 처리)
    v_total := coalesce(v_mc.total_amount, 0);
    
    -- 잔여 금액 계산 (0보다 작으면 0으로 설정)
    v_remaining := greatest(0, v_total - v_deducted);

    -- managed_client의 total_amount를 잔여 금액으로 업데이트
    update erp.managed_client
       set total_amount = v_remaining,
           updated_at = now()
     where id = v_wr.managed_client_id;

    -- work_request 업데이트: 승인 상태 및 승인 시점 스냅샷 저장
    update erp.work_request
       set status = 'approved',
           approved_at = now(),
           approved_by = p_client_id,
           updated_at = now(),
           approval_deducted_amount = v_deducted,
           approval_remaining_amount = v_remaining
     where id = v_wr.id;
  elsif v_wr.work_type = 'maintenance' then
    update erp.work_request
       set status = 'approved',
           approved_at = now(),
           approved_by = p_client_id,
           updated_at = now(),
           approval_text_edit_count = coalesce(v_mc.detail_text_edit_count, 0),
           approval_coding_edit_count = coalesce(v_mc.detail_coding_edit_count, 0),
           approval_image_edit_count = coalesce(v_mc.detail_image_edit_count, 0),
           approval_popup_design_count = coalesce(v_mc.detail_popup_design_count, 0),
           approval_banner_design_count = coalesce(v_mc.detail_banner_design_count, 0)
     where id = v_wr.id;
  else
    update erp.work_request
       set status = 'approved',
           approved_at = now(),
           approved_by = p_client_id,
           updated_at = now()
     where id = v_wr.id;
  end if;

  return query select true, null, v_wr.id, v_wr.employee_id;
end;
$$;

