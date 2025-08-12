"use client";

import React, { useState } from "react";
import { RoomResult } from "@/@types";
import { deleteCompanion, getRooms } from "@/lib/api";
import CompanionCard from "@/components/CompanionCard";
import AddCompanionForm from "@/components/AddCompanionForm";

export default function CompanionsClient({
  rooms: initialRooms,
}: {
  rooms: RoomResult;
}) {
  const [rooms, setRooms] = useState<RoomResult>(initialRooms);

  const fetchRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("本当に削除しますか？")) {
      try {
        await deleteCompanion(id);
        fetchRooms();
      } catch (error) {
        console.error("Failed to delete companion:", error);
      }
    }
  };

  return (
    <>
      <AddCompanionForm rooms={rooms} onAdd={fetchRooms} />
      {rooms.map((room) => (
        <div key={room.id} style={{ marginBottom: "2rem" }}>
          <h3>{room.name}</h3>
          <hr />
          <div className="grid medium-space">
            {room.companions.map((companion) => (
              <CompanionCard
                key={companion.id}
                companion={companion}
                onDelete={handleDelete}
              />
            ))}
          </div>
          {room.companions.length === 0 && (
            <p
              style={{ color: "#888", textAlign: "center", marginTop: "2rem" }}
            >
              コンパニオンがいません
            </p>
          )}
        </div>
      ))}
    </>
  );
}
