import { getCompanion, getRooms } from "@/lib/api";
import MoveCompanionClient from "./MoveCompanionClient";
export const fetchCache = "default-no-store";
export const dynamic = "force-dynamic";

export default async function MoveCompanion({
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
    const rooms = await getRooms();

    return <MoveCompanionClient companion={companion} rooms={rooms} />;
  } catch (error) {
    return <div>データの取得に失敗しました</div>;
  }
}
