import React from "react";
import { getRooms } from "@/lib/api";
import CompanionsClient from "./CompanionsClient";

export default async function Companions() {
  const rooms = await getRooms();

  return <CompanionsClient rooms={rooms} />;
}
