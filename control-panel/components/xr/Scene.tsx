"use client";
import { RoomResult } from "@/@types";
import {
  AgentManager,
  NavMeshManager,
  RecastNavMeshFactory,
} from "@/lib/xr/navigation/NavigationManager";
import { useFrame, useThree } from "@react-three/fiber";
import { useXRMeshes, XRMeshModel, XRSpace } from "@react-three/xr";
import { Crowd, init } from "@recast-navigation/core";
import { useEffect } from "react";
import { create } from "zustand";
import { Mesh } from "three";
import {
  CompanionManager,
  CompanionManagerImpl,
} from "@/lib/xr/companion/CompanionManager";
import mqtt from "mqtt";
import z from "zod";

interface MeshStore {
  meshes: Map<string, Mesh>;
  setMeshes: (key: string, mesh: Mesh) => void;
  getMeshByLabel: (label: string) => Mesh | undefined;
}

const MessageSchema = z.object({
  from: z.string(),
  to: z.union([z.enum(["all", "none"]), z.string()]),
  message: z.string(),
});

const ActionSchema = z.object({
  from: z.string(),
  name: z.string(),
  params: z.record(z.string(), z.any()),
});

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
  const companions = new Map<string, CompanionManager>();

  const client = mqtt.connect("ws://192.168.1.16:8883");

  client.on("connect", () => {
    client.subscribe("messages/" + room.id);
    client.subscribe("actions");
  });

  client.on("message", async (message, payload) => {
    switch (message) {
      case "messages/" + room.id: {
        const parsed = MessageSchema.parse(payload);
        const from = companions.get(parsed.from);
        if (!from) {
          return;
        }
        from.speak(parsed.message);
        break;
      }
      case "actions": {
        const parsed = ActionSchema.parse(payload);
        const from = companions.get(parsed.from);
        if (!from) {
          return;
        }
        switch (parsed.name) {
          case "move": {
            from.walk(parsed.params.x, parsed.params.y, parsed.params.z);
          }
          case "look": {
            from.lookAt(parsed.params.x, parsed.params.y, parsed.params.z);
          }
        }
        break;
      }
    }
  });

  const onSessionStart = async () => {
    try {
      await init();
    } catch (e) {
      console.log(e);
    }

    if (!window.SpeechRecognition || window.webkitSpeechRecognition) {
      alert("このブラウザはWeb Speech APIに対応していません!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript.trim();

      client.publish(
        "messages/" + room.id,
        JSON.stringify({ from: "admin", to: "all", message: transcript })
      );
    };

    recognition.start();
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) {
      alert("このブラウザはWeb Speech APIに対応していません!");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.pitch = 1.0;
    utterance.rate = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const japaneseVoice = voices.find((voice) => voice.lang === "ja-JP");
    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const setupNavMesh = async () => {
    const navigation = new NavMeshManager(new RecastNavMeshFactory());
    navigation.bake(Array.from(meshes.values()));
    const navMesh = navigation.getNavMesh();
    if (!navMesh) return;
    const crowd = new Crowd(navMesh, {
      maxAgents: 1,
      maxAgentRadius: 0.6,
    });
    await Promise.all(
      room.companions.map(async (companion) => {
        const agent = new AgentManager(navMesh, crowd);
        const CompanionManager = new CompanionManagerImpl(
          "/AliciaSolid-1.0.vrm",
          agent,
          scene,
          speak
        );
        companions.set(companion.id, CompanionManager);
        await CompanionManager.spawn();
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

  useFrame((state, delta) => {
    companions.values().map((companion) => {
      companion.update(delta);
    });
  });

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
