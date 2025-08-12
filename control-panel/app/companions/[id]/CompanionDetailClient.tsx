"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Companion, type RoomResult } from "@/@types";
import { deleteCompanion } from "@/lib/api";

interface CompanionDetailClientProps {
  companion: Companion;
  room?: RoomResult[0];
}

export default function CompanionDetailClient({
  companion,
  room,
}: CompanionDetailClientProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm(`${companion.name}を本当に削除しますか？`)) {
      try {
        await deleteCompanion(companion.id);
        router.push("/companions");
      } catch (err) {
        console.error("Failed to delete companion:", err);
      }
    }
  };

  return (
    <>
      <div>
        <Link href="/companions">
          <button className="small">← コンパニオン一覧に戻る</button>
        </Link>
      </div>

      <h2>{companion.name}</h2>

      <div className="grid">
        <article className="s6">
          <div className="padding">
            <img
              src={companion.icon}
              alt={`${companion.name}のアイコン`}
              className="round large"
            />
          </div>
          <div className="padding">
            <h6>基本情報</h6>
            <p>ID: {companion.id}</p>
            <p>
              作成日時: {new Date(companion.createdAt).toLocaleString("ja-JP")}
            </p>
            <p>
              更新日時: {new Date(companion.updatedAt).toLocaleString("ja-JP")}
            </p>
            {room && <p>所属部屋: {room.name}</p>}
          </div>
        </article>

        <article className="s6">
          <div className="padding">
            <h6>性格</h6>
            <p>{companion.personality}</p>

            <h6>ストーリー</h6>
            <p>{companion.story}</p>

            <h6>サンプル</h6>
            <p>{companion.sample}</p>
          </div>
        </article>
      </div>

      <div className="padding">
        <Link href={`/companions/edit?id=${companion.id}`}>
          <button>編集</button>
        </Link>
        <Link href={`/companions/move?id=${companion.id}`}>
          <button>移動</button>
        </Link>
        <button onClick={handleDelete}>削除</button>
      </div>
    </>
  );
}
