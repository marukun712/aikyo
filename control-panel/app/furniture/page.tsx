import React from "react";
import { getRooms } from "@/lib/api";
import FurnitureClient from "./FurnitureClient";
export const fetchCache = "default-no-store";
export const dynamic = "force-dynamic";

export default async function FurniturePage() {
  const rooms = await getRooms();

  return <FurnitureClient rooms={rooms} />;
}
