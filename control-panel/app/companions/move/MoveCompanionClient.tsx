"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RoomResult } from "@/@types";
import { moveCompanion } from "@/lib/api";

type Companion = {
  id: string;
  name: string;
  personality: string;
  story: string;
  sample: string;
  icon: string;
  roomId: string;
  createdAt: string;
  updatedAt: string;
};

interface MoveCompanionClientProps {
  companion: Companion;
  rooms: RoomResult;
}

export default function MoveCompanionClient({
  companion,
  rooms,
}: MoveCompanionClientProps) {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const roomId = formData.get("roomId") as string;

    try {
      await moveCompanion(companion.id, roomId);
      router.push("/companions");
    } catch (error) {
      console.error("Failed to move companion:", error);
    }
  };

  const handleCancel = () => {
    router.push("/companions");
  };

  return (
    <div>
      <h2>{companion.name}を移動</h2>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <div className="field border label">
            <select name="roomId" defaultValue={companion.roomId} required>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            <label>移動先ルーム</label>
          </div>
          <div className="row">
            <button type="submit">移動</button>
            <button type="button" onClick={handleCancel}>
              キャンセル
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}