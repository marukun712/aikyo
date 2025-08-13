"use client";

import React, { useState } from "react";
import { RoomResult } from "@/@types";
import { addCompanion } from "@/lib/api";

interface AddCompanionFormProps {
  rooms: RoomResult;
  onAdd: () => void;
}

interface CompanionData {
  name: string;
  personality: string;
  story: string;
  sample: string;
  icon: string;
}

export default function AddCompanionForm({
  rooms,
  onAdd,
}: AddCompanionFormProps) {
  const [isUsingJson, setIsUsingJson] = useState(false);

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData: CompanionData = JSON.parse(
          event.target?.result as string
        );

        const form = document.getElementById(
          "companion-form"
        ) as HTMLFormElement;
        (form.elements.namedItem("name") as HTMLInputElement).value =
          jsonData.name || "";
        (form.elements.namedItem("personality") as HTMLTextAreaElement).value =
          jsonData.personality || "";
        (form.elements.namedItem("story") as HTMLTextAreaElement).value =
          jsonData.story || "";
        (form.elements.namedItem("sample") as HTMLTextAreaElement).value =
          jsonData.sample || "";
        (form.elements.namedItem("icon") as HTMLInputElement).value =
          jsonData.icon || "";
      } catch (error) {
        alert(
          "JSONファイルの読み込みに失敗しました。正しい形式のファイルを選択してください。"
        );
      }
    };
    reader.readAsText(file);
  };

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
    <form id="companion-form" onSubmit={handleSubmit} className="padding">
      <fieldset>
        <legend>コンパニオン追加</legend>

        <div className="field label">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={isUsingJson}
              onChange={(e) => setIsUsingJson(e.target.checked)}
            />
            <span>JSONファイルから読み込む</span>
          </label>
        </div>

        {isUsingJson && (
          <div className="field label suffix border">
            <input type="file" accept=".json" onChange={handleJsonUpload} />
            <input type="text" />
            <label>File</label>
            <i>attach_file</i>
          </div>
        )}

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
