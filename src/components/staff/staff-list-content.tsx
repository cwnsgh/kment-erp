"use client";

import { useState } from "react";
import { StaffTable } from "./staff-table";
import { StaffDetailModal } from "./staff-detail-modal";
import type { StaffListItem } from "@/app/actions/staff";

type StaffListContentProps = {
  initialList: StaffListItem[];
  total: number;
  roleOptions: { id: number; name: string }[];
  page: number;
  pageSize: number;
  searchType: string;
  searchKeyword: string;
};

export function StaffListContent({
  initialList,
  total,
  roleOptions,
  page,
  pageSize,
  searchType,
  searchKeyword,
}: StaffListContentProps) {
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
        basePath="/staff"
        onRowClick={handleRowClick}
      />
      <StaffDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        staffId={selectedId}
      />
    </>
  );
}
