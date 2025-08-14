import { RoomResult } from "@/@types";
import Card from "@/components/ui/card";
import { getRooms } from "@/lib/api";
import Link from "next/link";
export const fetchCache = "default-no-store";
export const dynamic = "force-dynamic";

function HomeList({ rooms }: { rooms: RoomResult[] }) {
  return (
    <>
      <div>
        <Link href="/rooms/add">
          <button>新しいルームを追加</button>
        </Link>
      </div>
      <div className="grid medium-space">
        {rooms.map((room) => {
          return (
            <Card
              title={room.name}
              key={room.id}
              description={`所属コンパニオン ${room.companions.length} , 家具 ${room.furniture.length}`}
            />
          );
        })}
      </div>
    </>
  );
}

export default async function Home() {
  const rooms = await getRooms();
  return <HomeList rooms={rooms} />;
}
