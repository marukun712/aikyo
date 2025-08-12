import { getCompanion, getRooms } from "@/lib/api";
import CompanionDetailClient from "./CompanionDetailClient";

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
    const [companion, rooms] = await Promise.all([
      getCompanion(id),
      getRooms(),
    ]);

    const room = rooms.find((r) => r.companions.some((c) => c.id === id));

    return <CompanionDetailClient companion={companion} room={room} />;
  } catch (error) {
    return <div>コンパニオンが見つかりませんでした</div>;
  }
}