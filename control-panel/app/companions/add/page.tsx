import { RoomResult } from "@/@types";
import { addCompanion, getRooms } from "@/lib/api";

function AddForm({ rooms }: { rooms: RoomResult }) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const personality = formData.get("personality") as string;
    const story = formData.get("story") as string;
    const sample = formData.get("sample") as string;
    const icon = formData.get("icon") as string;
    const room = formData.get("room") as string;

    await addCompanion(name, personality, story, sample, icon, room);
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Fill all fields</legend>
        <div className="field border label">
          <input type="text" name="name" />
          <label>name</label>
        </div>
        <div className="field border label textarea">
          <textarea name="personality"></textarea>
          <label>personality</label>
        </div>
        <div className="field border label textarea">
          <textarea name="story"></textarea>
          <label>story</label>
        </div>
        <div className="field border label textarea">
          <textarea name="sample"></textarea>
          <label>sample</label>
        </div>
        <div className="field border label">
          <input type="text" name="icon" />
          <label>icon</label>
        </div>
        <div className="field border label">
          <select name="room">
            {rooms.map((room) => (
              <option key={room.name} value={room.name}>
                {room.name}
              </option>
            ))}
          </select>
          <label>Room</label>
        </div>
        <button type="submit">Submit</button>
      </fieldset>
    </form>
  );
}

export default async function Add() {
  const rooms = await getRooms();

  return <AddForm rooms={rooms} />;
}
