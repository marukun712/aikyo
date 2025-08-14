"use client";

import React from "react";
import Link from "next/link";
import { Furniture } from "@/@types";

interface FurnitureCardProps {
  furniture: Furniture & { roomName: string };
  onDelete: (id: string) => void;
}

export default function FurnitureCard({
  furniture,
  onDelete,
}: FurnitureCardProps) {
  return (
    <article className="s6">
      <div className="padding">
        <h5>{furniture.label}</h5>
        <p>
          座標: ({furniture.x}, {furniture.y}, {furniture.z})
        </p>
        <p>部屋: {furniture.roomName}</p>
        <div>
          <button>
            <Link href={`/furniture/edit?id=${furniture.id}`}>編集</Link>
          </button>
          <button onClick={() => onDelete(furniture.id)}>削除</button>
        </div>
      </div>
    </article>
  );
}
