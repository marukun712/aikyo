import { getCompanion, getRoom } from "@/lib/api";
import CompanionDetailClient from "./CompanionDetailClient";
export const fetchCache = "default-no-store";
export const dynamic = "force-dynamic";

export default async function CompanionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    return <div>コンパニオンIDが指定されていません</div>;
  }

  try {
    const companion = await getCompanion(id);
    const room = await getRoom(companion.roomId);

    return <CompanionDetailClient companion={companion} room={room} />;
  } catch (error) {
    return <div>コンパニオンが見つかりませんでした</div>;
  }
}
