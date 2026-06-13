import { getStaticIDs } from "@/lib/static-data";
import EditUserClientPage from "./edit-user-client-page";

export async function generateStaticParams() {
  const ids = getStaticIDs();
  return ids.map((id: string) => ({ id }));
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditUserClientPage id={id} />;
}
