import { RoomResult } from "@/@types";
import Card from "@/components/ui/card";
import { getRooms } from "@/lib/api";

function HomeList({ rooms }: { rooms: RoomResult }) {
  return (
    <div className="grid medium-space">
      {rooms.map((room) => {
        return (
          <Card
            title={room.name}
            description={`所属コンパニオン:${room.companions.length} , 家具 ${room.furniture.length}`}
          />
        );
      })}
    </div>
  );
}

export default async function Home() {
  const rooms = await getRooms();
  return <HomeList rooms={rooms} />;
}
