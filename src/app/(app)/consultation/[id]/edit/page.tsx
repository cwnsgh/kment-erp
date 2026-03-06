import { notFound } from "next/navigation";
import { requireMenuPermission } from "@/lib/require-menu-permission";
import { getConsultationDetail, getConsultationCategories } from "@/app/actions/consultation";
import { ConsultationRegistrationForm } from "@/components/consultation/consultation-registration-form";

type Props = { params: Promise<{ id: string }> | { id: string } };

export default async function ConsultationEditPage(props: Props) {
  await requireMenuPermission("/consultation");

  const params = await Promise.resolve(props.params);
  const id = params?.id;
  if (!id) notFound();

  const [detailResult, categoriesResult] = await Promise.all([
    getConsultationDetail(id),
    getConsultationCategories(),
  ]);

  if (!detailResult.success || !detailResult.data) notFound();

  const categories = categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];

  return (
    <ConsultationRegistrationForm
      categories={categories}
      mode="edit"
      initialData={detailResult.data}
    />
  );
}
