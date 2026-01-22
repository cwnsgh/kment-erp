import { ManagedClientEditForm } from "@/components/operations/managed-client-edit-form";

type EditPageProps = {
  params: {
    id: string;
  };
};

export default function EditManagedClientPage({ params }: EditPageProps) {
  return <ManagedClientEditForm managedClientId={params.id} />;
}

