-- 업무 승인 처리 (원자적 차감 + 스냅샷 저장)
-- 실행 후 Supabase에 함수가 생성됩니다.

create or replace function approve_work_request(
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
    from work_request
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
      from managed_client
     where id = v_wr.managed_client_id
     for update;
  end if;

  if v_wr.work_type = 'deduct' and v_wr.cost is not null then
    v_deducted := v_wr.cost;
    v_total := coalesce(v_mc.total_amount, 0);
    v_remaining := greatest(0, v_total - v_deducted);

    update managed_client
       set total_amount = v_remaining
     where id = v_wr.managed_client_id;

    update work_request
       set status = 'approved',
           approved_at = now(),
           approved_by = p_client_id,
           updated_at = now(),
           approval_deducted_amount = v_deducted,
           approval_remaining_amount = v_remaining
     where id = v_wr.id;
  elsif v_wr.work_type = 'maintenance' then
    update work_request
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
    update work_request
       set status = 'approved',
           approved_at = now(),
           approved_by = p_client_id,
           updated_at = now()
     where id = v_wr.id;
  end if;

  return query select true, null, v_wr.id, v_wr.employee_id;
end;
$$;

