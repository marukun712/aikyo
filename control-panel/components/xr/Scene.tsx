import { RoomResult } from "@/@types";
import {
  AgentManager,
  NavMeshManager,
  RecastNavMeshFactory,
} from "@/lib/xr/navgation/NavigationManager";
import { VRMLoader } from "@/lib/xr/vrm/VRMLoader";
import { useThree } from "@react-three/fiber";
import { useXRMeshes, XRMeshModel, XRSpace } from "@react-three/xr";
import { init } from "@recast-navigation/core";
import { useEffect } from "react";
import { GLTF } from "three/examples/jsm/Addons.js";
import { create } from "zustand";
import { Mesh } from "three";

interface MeshStore {
  meshes: Map<string, Mesh>;
  setMeshes: (key: string, mesh: Mesh) => void;
  getMeshByLabel: (label: string) => Mesh | undefined;
}

export default function Scene({ room }: { room: RoomResult }) {
  const { scene, gl } = useThree();
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
  const companions = new Map<string, GLTF>();

  const onSessionStart = async () => {
    try {
      await init();
      const loader = new VRMLoader();

      await Promise.all(
        room.companions.map(async (companion) => {
          const { gltf } = await loader.load("/AliciaSolid-1.0.vrm");
          scene.add(gltf.scene);
          companions.set(companion.id, gltf);
        })
      );
    } catch (e) {
      console.log(e);
    }
  };

  const setupNavMesh = () => {
    //NavMeshをベイク
    const navigation = new NavMeshManager(new RecastNavMeshFactory());
    navigation.bake(Array.from(meshes.values()));

    const navMesh = navigation.getNavMesh();
    if (!navMesh) return;

    const agent = new AgentManager(navMesh);
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

  gl.xr.addEventListener("sessionstart", onSessionStart);

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
