import React from "react";
import { getRooms } from "@/lib/api";
import CompanionsClient from "./CompanionsClient";
export const fetchCache = "default-no-store";
export const dynamic = "force-dynamic";

export default async function Companions() {
  const rooms = await getRooms();

  return <CompanionsClient rooms={rooms} />;
}
