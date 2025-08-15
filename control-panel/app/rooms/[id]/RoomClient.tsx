"use client";
import { Canvas } from "@react-three/fiber";
import Scan from "@/components/xr/Scan";
import { RoomResult } from "@/@types";
import { XR } from "@react-three/xr";
import { createXRStore } from "@react-three/xr";

const store = createXRStore({
  depthSensing: true,
  hand: { teleportPointer: true, model: false },
});

export default function RoomClient({ room }: { room: RoomResult }) {
  return (
    <>
      <button onClick={() => store.enterAR()}>スキャンを開始</button>

      <Canvas>
        <XR store={store}>
          <ambientLight />
          <Scan room={room} />
        </XR>
      </Canvas>
    </>
  );
}
