import { notFound } from "next/navigation";
import { requireMenuPermission } from "@/lib/require-menu-permission";
import { getStaffById, getRoleOptions, canViewStaffAdminMemo } from "@/app/actions/staff";
import { StaffRegistrationForm } from "@/components/staff/staff-registration-form";

type Props = { params: Promise<{ id: string }> | { id: string } };

export default async function StaffEditPage(props: Props) {
  await requireMenuPermission("/staff");

  const params = await Promise.resolve(props.params);
  const id = params?.id;
  if (!id) notFound();

  const [detailResult, roleOptions, canViewAdminMemo] = await Promise.all([
    getStaffById(id),
    getRoleOptions(),
    canViewStaffAdminMemo(),
  ]);

  if (!detailResult.success || !detailResult.data) {
    notFound();
  }

  return (
    <StaffRegistrationForm
      mode="edit"
      initialData={detailResult.data}
      roleOptions={roleOptions}
      canViewAdminMemo={canViewAdminMemo}
    />
  );
}
