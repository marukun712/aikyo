import Scan from "@/components/xr/Scan";
import { getRoom } from "@/lib/api";
import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
export const fetchCache = "default-no-store";
export const dynamic = "force-dynamic";

const store = createXRStore({
  depthSensing: true,
  hand: { teleportPointer: true, model: false },
});

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    return <div>Room IDが指定されていません</div>;
  }

  try {
    const room = await getRoom(id);

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
  } catch (error) {
    return <div>コンパニオンが見つかりませんでした</div>;
  }
}
