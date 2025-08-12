import { getFurniture, getRooms } from "@/lib/api";
import EditFurnitureClient from "./EditFurnitureClient";

export default async function EditFurniture({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const furnitureId = params.id;

  if (!furnitureId) {
    return <div>家具IDが指定されていません</div>;
  }

  try {
    const [furniture, rooms] = await Promise.all([
      getFurniture(furnitureId),
      getRooms(),
    ]);
    return <EditFurnitureClient furniture={furniture} rooms={rooms} />;
  } catch (error) {
    return <div>データの取得に失敗しました</div>;
  }
}