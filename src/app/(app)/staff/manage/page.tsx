import { requireMenuPermission } from "@/lib/require-menu-permission";
import { getStaffList, getRoleOptions } from "@/app/actions/staff";
import { StaffManageContent } from "@/components/staff/staff-manage-content";
import styles from "../page.module.css";

type SearchParams = { page?: string; pageSize?: string; searchType?: string; searchKeyword?: string };

export default async function StaffManagePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  await requireMenuPermission("/staff/manage");

  const resolved = await Promise.resolve(searchParams);
  const page = Math.max(1, Number(resolved?.page) || 1);
  const pageSize = Math.min(200, Math.max(10, Number(resolved?.pageSize) || 10));
  const searchType = (resolved?.searchType as "name" | "grade" | "work") || "";
  const searchKeyword = resolved?.searchKeyword ?? "";

  const [listResult, roleOptions] = await Promise.all([
    getStaffList({ page, pageSize, searchType: searchType || undefined, searchKeyword: searchKeyword || undefined }),
    getRoleOptions(),
  ]);

  const list = listResult.success ? listResult.data ?? [] : [];
  const total = listResult.success ? listResult.total ?? 0 : 0;

  return (
    <div className={`${styles.staffPage} page_section`}>
      <div className="page_title">
        <h1>직원 관리</h1>
      </div>
      <div className={styles.whiteBox}>
        <div className={styles.boxInner}>
          <StaffManageContent
            initialList={list}
            total={total}
            roleOptions={roleOptions}
            page={page}
            pageSize={pageSize}
            searchType={searchType}
            searchKeyword={searchKeyword}
          />
        </div>
      </div>
    </div>
  );
}
