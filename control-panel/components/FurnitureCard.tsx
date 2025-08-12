"use client";

import React from "react";
import Link from "next/link";

type Furniture = {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  roomId: string;
  createdAt: string;
  updatedAt: string;
};

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
        <div className="row">
          <Link href={`/furniture/edit?id=${furniture.id}`}>
            <button className="small">編集</button>
          </Link>
          <button className="small" onClick={() => onDelete(furniture.id)}>
            削除
          </button>
        </div>
      </div>
    </article>
  );
}
