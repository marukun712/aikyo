import { getRoom } from "@/lib/api";
import ScanClient from "./ScanClient";
export const fetchCache = "default-no-store";
export const dynamic = "force-dynamic";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    return <div>Room IDが指定されていません</div>;
  }

  try {
    const room = await getRoom(id);

    return <ScanClient room={room} />;
  } catch (error) {
    return <div>コンパニオンが見つかりませんでした</div>;
  }
}
