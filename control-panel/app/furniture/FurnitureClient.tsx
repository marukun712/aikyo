"use client";

import React, { useState } from "react";
import { RoomResult } from "@/@types";
import { deleteFurniture, getRooms } from "@/lib/api";
import FurnitureCard from "@/components/FurnitureCard";
import AddFurnitureForm from "@/components/AddFurnitureForm";

export default function FurnitureClient({
  rooms: initialRooms,
}: {
  rooms: RoomResult[];
}) {
  const [rooms, setRooms] = useState<RoomResult[]>(initialRooms);

  const fetchRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (error) {
      console.error("部屋情報の取得に失敗しました:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("本当にこの家具を削除しますか？")) {
      try {
        await deleteFurniture(id);
        fetchRooms();
      } catch (error) {
        console.error("家具の削除に失敗しました:", error);
      }
    }
  };

  const allFurniture = rooms.flatMap((room) =>
    room.furniture.map((furniture) => ({ ...furniture, roomName: room.name }))
  );

  return (
    <>
      <AddFurnitureForm rooms={rooms} onAdd={fetchRooms} />

      <div className="grid medium-space">
        {allFurniture.map((furniture) => (
          <FurnitureCard
            key={furniture.id}
            furniture={furniture}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </>
  );
}
