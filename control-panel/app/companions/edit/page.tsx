import { getCompanion } from "@/lib/api";
import EditCompanionClient from "./EditCompanionClient";
export const fetchCache = "default-no-store";
export const dynamic = "force-dynamic";

export default async function EditCompanion({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const companionId = params.id;

  if (!companionId) {
    return <div>コンパニオンIDが指定されていません</div>;
  }

  try {
    const companion = await getCompanion(companionId);

    return <EditCompanionClient companion={companion} />;
  } catch (error) {
    return <div>コンパニオンが見つかりませんでした</div>;
  }
}
