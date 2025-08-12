"use client";

import React from "react";
import { RoomResult } from "@/@types";
import { addCompanion } from "@/lib/api";

interface AddCompanionFormProps {
  rooms: RoomResult;
  onAdd: () => void;
}

export default function AddCompanionForm({ rooms, onAdd }: AddCompanionFormProps) {

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const personality = formData.get("personality") as string;
    const story = formData.get("story") as string;
    const sample = formData.get("sample") as string;
    const icon = formData.get("icon") as string;
    const room = formData.get("room") as string;

    await addCompanion(name, personality, story, sample, icon, room);
    form.reset();
    onAdd();
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>コンパニオン追加</legend>
        <div className="field border label">
          <input type="text" name="name" required />
          <label>名前</label>
        </div>
        <div className="field border label textarea">
          <textarea name="personality"></textarea>
          <label>性格</label>
        </div>
        <div className="field border label textarea">
          <textarea name="story"></textarea>
          <label>ストーリー</label>
        </div>
        <div className="field border label textarea">
          <textarea name="sample"></textarea>
          <label>サンプル</label>
        </div>
        <div className="field border label">
          <input type="text" name="icon" />
          <label>アイコン</label>
        </div>
        <div className="field border label">
          <select name="room" required>
            <option value="">ルームを選択してください</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          <label>ルーム</label>
        </div>
        <button type="submit">追加</button>
      </fieldset>
    </form>
  );
}