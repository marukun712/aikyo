"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { addRoom } from "@/lib/api";

export default function AddRoomFormClient() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;

    await addRoom(name);
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>新しいルームを追加</legend>
        <div className="field border label">
          <input type="text" name="name" required />
          <label>ルーム名</label>
        </div>
        <button type="submit">追加</button>
      </fieldset>
    </form>
  );
}
