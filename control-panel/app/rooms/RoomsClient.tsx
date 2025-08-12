"use client";

import React, { useState } from "react";
import { RoomResult } from "@/@types";

function RoomCard({ room }: { room: RoomResult[0] }) {
  return (
    <article className="no-padding s6">
      <div className="padding">
        <h5>{room.name}</h5>
        <p>
          所属コンパニオン: {room.companions.length}, 家具:{" "}
          {room.furniture.length}
        </p>
        <button className="small">編集</button>
      </div>
    </article>
  );
}

export default function RoomsClient({
  rooms: initialRooms,
}: {
  rooms: RoomResult;
}) {
  return (
    <>
      <div className="row">
        <a href="/rooms/add">
          <button>新しいルームを追加</button>
        </a>
      </div>

      <div className="grid medium-space">
        {initialRooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </>
  );
}
