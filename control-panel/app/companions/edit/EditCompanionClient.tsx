"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { updateCompanion } from "@/lib/api";
import { type Companion } from "@/@types";

interface EditCompanionClientProps {
  companion: Companion;
}

export default function EditCompanionClient({
  companion,
}: EditCompanionClientProps) {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const updates = {
      name: formData.get("name") as string,
      personality: formData.get("personality") as string,
      story: formData.get("story") as string,
      sample: formData.get("sample") as string,
      icon: formData.get("icon") as string,
    };

    try {
      await updateCompanion(companion.id, updates);
      router.push("/companions");
    } catch (error) {
      console.error("Failed to update companion:", error);
    }
  };

  const handleCancel = () => {
    router.push("/companions");
  };

  return (
    <div>
      <h2>コンパニオン編集</h2>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <div className="field border label">
            <input
              type="text"
              name="name"
              defaultValue={companion.name}
              required
            />
            <label>名前</label>
          </div>
          <div className="field border label textarea">
            <textarea
              name="personality"
              defaultValue={companion.personality}
            ></textarea>
            <label>性格</label>
          </div>
          <div className="field border label textarea">
            <textarea name="story" defaultValue={companion.story}></textarea>
            <label>ストーリー</label>
          </div>
          <div className="field border label textarea">
            <textarea name="sample" defaultValue={companion.sample}></textarea>
            <label>サンプル</label>
          </div>
          <div className="field border label">
            <input type="text" name="icon" defaultValue={companion.icon} />
            <label>アイコン</label>
          </div>
          <div className="row">
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
