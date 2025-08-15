"use client";
import { Canvas } from "@react-three/fiber";
import { RoomResult } from "@/@types";
import { XR } from "@react-three/xr";
import { createXRStore } from "@react-three/xr";
import Scene from "@/components/xr/Scene";

const store = createXRStore({
  depthSensing: true,
  hand: { teleportPointer: true, model: false },
});

export default function ScanClient({ room }: { room: RoomResult }) {
  return (
    <>
      <button onClick={() => store.enterAR()}>スキャンを開始</button>

      <Canvas>
        <XR store={store}>
          <ambientLight />
          <Scene room={room} />
        </XR>
      </Canvas>
    </>
  );
}
