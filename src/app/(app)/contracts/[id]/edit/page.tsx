import { getContractDetail } from "@/app/actions/contract";
import { ContractEditForm } from "@/components/contracts/contract-edit-form";
import { notFound } from "next/navigation";

type ContractEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContractEditPage({ params }: ContractEditPageProps) {
  const { id } = await params;
  const result = await getContractDetail(id);

  if (!result.success || !result.detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ContractEditForm detail={result.detail} contractId={id} />
    </div>
  );
}
