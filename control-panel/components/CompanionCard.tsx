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
        <h5>{companion.name}</h5>
        <p>性格: {companion.personality}</p>
        <p>ストーリー: {companion.story}</p>
        <div className="row">
          <Link href={`/companions/edit?id=${companion.id}`}>
            <button className="small">編集</button>
          </Link>
          <Link href={`/companions/move?id=${companion.id}`}>
            <button className="small">移動</button>
          </Link>
          <button className="small" onClick={() => onDelete(companion.id)}>
            削除
          </button>
        </div>
      </div>
    </article>
  );
}
