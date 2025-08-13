"use client";

import React from "react";
import Link from "next/link";
import { type Companion } from "@/@types";

interface CompanionCardProps {
  companion: Companion;
  onDelete: (id: string) => void;
}

export default function CompanionCard({
  companion,
  onDelete,
}: CompanionCardProps) {
  return (
    <article className="s6">
      <div className="padding">
        <Link href={`/companions/${companion.id}`}>
          <img className="round" src={companion.icon}></img>
        </Link>
        <h5>{companion.name}</h5>
        <p>性格: {companion.personality}</p>
        <p>ストーリー: {companion.story}</p>
        <div className="row">
          <button>
            <Link href={`/companions/${companion.id}`}>詳細 </Link>
          </button>
          <button>
            <Link href={`/companions/edit?id=${companion.id}`}>編集 </Link>
          </button>
          <button>
            <Link href={`/companions/move?id=${companion.id}`}>移動 </Link>
          </button>
          <button onClick={() => onDelete(companion.id)}>削除</button>
        </div>
      </div>
    </article>
  );
}
