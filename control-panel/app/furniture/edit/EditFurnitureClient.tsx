"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RoomResult } from "@/@types";
import { updateFurniture } from "@/lib/api";
import { type Furniture } from "@/@types";

interface EditFurnitureClientProps {
  furniture: Furniture;
  rooms: RoomResult[];
}

export default function EditFurnitureClient({
  furniture,
  rooms,
}: EditFurnitureClientProps) {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const updates = {
      label: formData.get("label") as string,
      x: parseInt(formData.get("x") as string),
      y: parseInt(formData.get("y") as string),
      z: parseInt(formData.get("z") as string),
      roomId: formData.get("roomId") as string,
    };

    try {
      await updateFurniture(furniture.id, updates);
      router.push("/furniture");
    } catch (error) {
      console.error("Failed to update furniture:", error);
    }
  };

  const handleCancel = () => {
    router.push("/furniture");
  };

  return (
    <div>
      <h2>家具編集</h2>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <div className="field border label">
            <input
              type="text"
              name="label"
              defaultValue={furniture.label}
              required
            />
            <label>名前</label>
          </div>
          <div>
            <div className="field border label">
              <input
                type="number"
                name="x"
                defaultValue={furniture.x}
                required
              />
              <label>X座標</label>
            </div>
            <div className="field border label">
              <input
                type="number"
                name="y"
                defaultValue={furniture.y}
                required
              />
              <label>Y座標</label>
            </div>
            <div className="field border label">
              <input
                type="number"
                name="z"
                defaultValue={furniture.z}
                required
              />
              <label>Z座標</label>
            </div>
          </div>
          <div className="field border label">
            <select name="roomId" defaultValue={furniture.roomId} required>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            <label>部屋</label>
          </div>
          <div>
            <button type="submit">更新</button>
            <button type="button" onClick={handleCancel}>
              キャンセル
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
