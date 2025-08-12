"use client";

import React from "react";
import { RoomResult } from "@/@types";
import { addFurniture } from "@/lib/api";

interface AddFurnitureFormProps {
  rooms: RoomResult;
  onAdd: () => void;
}

export default function AddFurnitureForm({
  rooms,
  onAdd,
}: AddFurnitureFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const label = formData.get("label") as string;
    const x = parseInt(formData.get("x") as string);
    const y = parseInt(formData.get("y") as string);
    const z = parseInt(formData.get("z") as string);
    const roomId = formData.get("roomId") as string;

    await addFurniture(label, x, y, z, roomId);
    form.reset();
    onAdd();
  };

  return (
    <form onSubmit={handleSubmit} className="padding">
      <fieldset>
        <legend>家具追加</legend>
        <div className="field border label">
          <input type="text" name="label" required />
          <label>名前</label>
        </div>
        <div className="row">
          <div className="field border label">
            <input type="number" name="x" required />
            <label>X座標</label>
          </div>
          <div className="field border label">
            <input type="number" name="y" required />
            <label>Y座標</label>
          </div>
          <div className="field border label">
            <input type="number" name="z" required />
            <label>Z座標</label>
          </div>
        </div>
        <div className="field border label">
          <select name="roomId" required>
            <option value="">部屋を選択してください</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          <label>部屋</label>
        </div>
        <button type="submit">追加</button>
      </fieldset>
    </form>
  );
}
