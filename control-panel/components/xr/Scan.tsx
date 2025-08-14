import { RoomResult } from "@/@types";
import { useXRMeshes, XRMeshModel, XRSpace } from "@react-three/xr";
import { useEffect } from "react";
import { create } from "zustand";
import { Mesh } from "three";
import { addFurniture, resetFurniture } from "@/lib/api";

interface MeshStore {
  meshes: Map<string, Mesh>;
  setMeshes: (key: string, mesh: Mesh) => void;
  getMeshByLabel: (label: string) => Mesh | undefined;
}

export default function Scan({ room }: { room: RoomResult }) {
  const xrMeshes = useXRMeshes();

  const useMeshStore = create<MeshStore>((set) => ({
    meshes: new Map<string, Mesh>(),
    setMeshes: (key: string, mesh: Mesh): void =>
      set((state) => {
        const newMap = new Map(state.meshes);
        newMap.set(key, mesh);
        return { meshes: newMap };
      }),
    getMeshByLabel: (label): Mesh | undefined =>
      useMeshStore.getState().meshes.get(label),
  }));

  const meshes = useMeshStore((state) => state.meshes);
  const setMeshes = useMeshStore((state) => state.setMeshes);

  const setupNavMesh = async () => {
    await resetFurniture(room.id);
    await Promise.all(
      [...meshes].map(async ([label, value]) => {
        await addFurniture(
          label,
          value.position.x,
          value.position.y,
          value.position.z,
          room.id
        );
      })
    );
  };

  //メッシュのタイプごとに色分け
  const getColorByLabel = (label: string) => {
    switch (label) {
      case "shelf":
        return "red";
      case "couch":
        return "blue";
      case "table":
        return "orange";
      case "global mesh":
        return "gray";
      case "screen":
        return "cyan";
      default:
        return "white";
    }
  };

  useEffect(() => {
    setupNavMesh();
  }, [meshes]);

  return (
    <>
      {xrMeshes.map((mesh) => (
        <XRSpace space={mesh.meshSpace} key={mesh.semanticLabel}>
          <XRMeshModel
            mesh={mesh}
            onUpdate={(self: Mesh) => {
              setMeshes(mesh.semanticLabel!, self);
            }}
          >
            <meshPhongMaterial
              color={getColorByLabel(mesh.semanticLabel!)}
              opacity={0}
              transparent={true}
            />
          </XRMeshModel>
        </XRSpace>
      ))}
    </>
  );
}
