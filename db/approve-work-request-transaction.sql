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
  v_count int;
  v_te int;
  v_co int;
  v_im int;
  v_po int;
  v_ba int;
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
  elsif v_wr.work_type = 'maintenance' and v_wr.managed_client_id is not null then
    -- 유지보수형: 승인 전 잔여 저장 후 차감, 승인 후 잔여를 work_request에 저장
    v_count := coalesce(v_wr.count, 0);
    -- 승인 전 = 현재 managed_client 값 (차감 전)
    v_te := greatest(0, coalesce(v_mc.detail_text_edit_count, 0) - case when v_wr.work_type_detail = 'textEdit' then v_count else 0 end);
    v_co := greatest(0, coalesce(v_mc.detail_coding_edit_count, 0) - case when v_wr.work_type_detail = 'codingEdit' then v_count else 0 end);
    v_im := greatest(0, coalesce(v_mc.detail_image_edit_count, 0) - case when v_wr.work_type_detail = 'imageEdit' then v_count else 0 end);
    v_po := greatest(0, coalesce(v_mc.detail_popup_design_count, 0) - case when v_wr.work_type_detail = 'popupDesign' then v_count else 0 end);
    v_ba := greatest(0, coalesce(v_mc.detail_banner_design_count, 0) - case when v_wr.work_type_detail = 'bannerDesign' then v_count else 0 end);

    update erp.managed_client
       set detail_text_edit_count = v_te,
           detail_coding_edit_count = v_co,
           detail_image_edit_count = v_im,
           detail_popup_design_count = v_po,
           detail_banner_design_count = v_ba,
           updated_at = now()
     where id = v_wr.managed_client_id;

    -- work_request: 승인 전(차감 전) 스냅샷 + 승인 후(차감 후) 스냅샷 저장
    update erp.work_request
       set status = 'approved',
           approved_at = now(),
           approved_by = p_client_id,
           updated_at = now(),
           approval_before_text_edit_count = coalesce(v_mc.detail_text_edit_count, 0),
           approval_before_coding_edit_count = coalesce(v_mc.detail_coding_edit_count, 0),
           approval_before_image_edit_count = coalesce(v_mc.detail_image_edit_count, 0),
           approval_before_popup_design_count = coalesce(v_mc.detail_popup_design_count, 0),
           approval_before_banner_design_count = coalesce(v_mc.detail_banner_design_count, 0),
           approval_text_edit_count = v_te,
           approval_coding_edit_count = v_co,
           approval_image_edit_count = v_im,
           approval_popup_design_count = v_po,
           approval_banner_design_count = v_ba
     where id = v_wr.id;
  elsif v_wr.work_type = 'maintenance' then
    update erp.work_request
       set status = 'approved',
           approved_at = now(),
           approved_by = p_client_id,
           updated_at = now()
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

