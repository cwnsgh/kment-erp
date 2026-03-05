import { requireMenuPermission } from "@/lib/require-menu-permission";
import { getRoleOptions, canViewStaffAdminMemo } from "@/app/actions/staff";
import { StaffRegistrationForm } from "@/components/staff/staff-registration-form";

export default async function StaffNewPage() {
  await requireMenuPermission("/staff/new");

  const [roleOptions, canViewAdminMemo] = await Promise.all([
    getRoleOptions(),
    canViewStaffAdminMemo(),
  ]);

  return (
    <StaffRegistrationForm
      mode="new"
      roleOptions={roleOptions}
      canViewAdminMemo={canViewAdminMemo}
    />
  );
}
