"use client";

import { useState } from "react";
import { StaffTable } from "./staff-table";
import { StaffDetailModal } from "./staff-detail-modal";
import type { StaffListItem } from "@/app/actions/staff";

type StaffManageContentProps = {
  initialList: StaffListItem[];
  total: number;
  roleOptions: { id: number; name: string }[];
  page: number;
  pageSize: number;
  searchType: string;
  searchKeyword: string;
};

export function StaffManageContent({
  initialList,
  total,
  roleOptions,
  page,
  pageSize,
  searchType,
  searchKeyword,
}: StaffManageContentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleRowClick = (id: string) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  return (
    <>
      <StaffTable
        initialList={initialList}
        total={total}
        roleOptions={roleOptions}
        page={page}
        pageSize={pageSize}
        searchType={searchType}
        searchKeyword={searchKeyword}
        basePath="/staff/manage"
        onRowClick={handleRowClick}
      />

      <StaffDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        staffId={selectedId}
        variant="manage"
      />
    </>
  );
}
