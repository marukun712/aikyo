"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { VRM, VRMLoaderPlugin } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import mqtt from "mqtt";
import { z } from "zod";

// MQTT メッセージスキーマ
const MessageSchema = z.object({
  from: z.string(),
  to: z.union([z.enum(["all", "none"]), z.string()]),
  message: z.string(),
});

const ActionSchema = z.object({
  data: z.object({
    from: z.string(),
    name: z.enum(["move", "look", "gesture"]),
    params: z.union([
      z.object({ x: z.number(), y: z.number(), z: z.number() }), // move, look
      z.object({ type: z.enum(["wave", "jump", "dance", "nod", "stretch", "clap"]) }) // gesture
    ]),
  }),
});

type MessageData = z.infer<typeof MessageSchema>;
type ActionData = z.infer<typeof ActionSchema>;

interface Companion {
  id: string;
  vrm: VRM | null;
  speechBubble?: THREE.Mesh;
  targetPosition?: THREE.Vector3;
  targetLook?: THREE.Vector3;
  isMoving: boolean;
  currentGesture?: string;
}

interface Furniture {
  id: string;
  label: string;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
}

export function Visualization() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const companionsRef = useRef<Map<string, Companion>>(new Map());
  const furnitureRef = useRef<Furniture[]>([]);
  const mqttClientRef = useRef<mqtt.MqttClient | null>(null);

  const [roomId, setRoomId] = useState("default-room");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    initThreeScene();
    initMQTT();
    animate();

    return () => {
      if (mqttClientRef.current) {
        mqttClientRef.current.end();
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  const initThreeScene = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // シーン
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // カメラ
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // レンダラー
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // ライティング
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // 床
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // リビングルーム家具を作成
    createLivingRoomFurniture();

    // VRMキャラクターをロード
    loadVRMCharacter();

    // マウスコントロール（簡易版）
    addCameraControls();

    // クロック
    clockRef.current = new THREE.Clock();

    // リサイズハンドラー
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);
  };

  const createLivingRoomFurniture = () => {
    const furniture: Furniture[] = [];

    if (!sceneRef.current) return;

    // ソファ
    const sofaGeometry = new THREE.BoxGeometry(3, 1, 1.5);
    const sofaMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const sofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
    sofa.position.set(-3, 0.5, -3);
    sofa.castShadow = true;
    sceneRef.current.add(sofa);
    furniture.push({
      id: "sofa",
      label: "ソファ",
      mesh: sofa,
      position: new THREE.Vector3(-3, 0.5, -3),
    });

    // テーブル
    const tableGeometry = new THREE.BoxGeometry(2, 0.8, 1);
    const tableMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(0, 0.4, -2);
    table.castShadow = true;
    sceneRef.current.add(table);
    furniture.push({
      id: "table",
      label: "テーブル",
      mesh: table,
      position: new THREE.Vector3(0, 0.4, -2),
    });

    // テレビ
    const tvGeometry = new THREE.BoxGeometry(0.2, 2, 3);
    const tvMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const tv = new THREE.Mesh(tvGeometry, tvMaterial);
    tv.position.set(4, 1, -4);
    tv.castShadow = true;
    sceneRef.current.add(tv);
    furniture.push({
      id: "tv",
      label: "テレビ",
      mesh: tv,
      position: new THREE.Vector3(4, 1, -4),
    });

    furnitureRef.current = furniture;
  };

  const loadVRMCharacter = async () => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    try {
      const gltf = await loader.loadAsync("/AliciaSolid-1.0.vrm");
      const vrm = gltf.userData.vrm as VRM;

      // 非推奨メソッドを使用しない
      // VRMUtils.removeUnnecessaryVertices(gltf.scene);
      // VRMUtils.removeUnnecessaryJoints(gltf.scene);

      vrm.scene.traverse((obj) => {
        obj.castShadow = true;
      });

      if (sceneRef.current) {
        sceneRef.current.add(vrm.scene);
      }

      // デフォルトキャラクターとして登録
      const companion: Companion = {
        id: "default-companion",
        vrm: vrm,
        isMoving: false,
      };
      companionsRef.current.set("default-companion", companion);
    } catch (error) {
      console.error("VRMの読み込みに失敗しました:", error);
    }
  };

  const addCameraControls = () => {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown || !cameraRef.current) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      const camera = cameraRef.current;
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 1, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleWheel = (event: WheelEvent) => {
      if (!cameraRef.current) return;
      const camera = cameraRef.current;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.add(direction.multiplyScalar(event.deltaY * 0.01));
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("wheel", handleWheel);
  };

  const initMQTT = () => {
    // relay-serverのwebsocket-stream実装に合わせた接続
    const client = mqtt.connect("ws://localhost:8080/", {
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });
    mqttClientRef.current = client;

    client.on("connect", () => {
      console.log("MQTT接続成功");
      setIsConnected(true);
      
      // メッセージをサブスクライブ
      client.subscribe(`messages/${roomId}`);
      client.subscribe("actions");
    });

    client.on("message", (topic, payload) => {
      try {
        const message = JSON.parse(payload.toString());

        if (topic.startsWith("messages/")) {
          const parsed = MessageSchema.safeParse(message);
          if (parsed.success) {
            handleMessage(parsed.data);
          }
        } else if (topic === "actions") {
          const parsed = ActionSchema.safeParse(message);
          if (parsed.success) {
            handleAction(parsed.data);
          }
        }
      } catch (error) {
        console.error("MQTT メッセージの解析エラー:", error);
      }
    });

    client.on("error", (error) => {
      console.error("MQTT接続エラー:", error);
      setIsConnected(false);
    });
  };

  const handleMessage = (message: MessageData) => {
    const companion = companionsRef.current.get(message.from);
    if (companion) {
      showSpeechBubble(companion, message.message);
    }
  };

  const handleAction = (action: ActionData) => {
    const companion = companionsRef.current.get(action.data.from);
    if (!companion || !companion.vrm) return;

    switch (action.data.name) {
      case "move":
        if ('x' in action.data.params) {
          moveCompanion(companion, action.data.params);
        }
        break;
      case "look":
        if ('x' in action.data.params) {
          lookAt(companion, action.data.params);
        }
        break;
      case "gesture":
        if ('type' in action.data.params) {
          performGesture(companion, action.data.params.type);
        }
        break;
    }
  };

  const moveCompanion = (companion: Companion, params: { x: number; y: number; z: number }) => {
    companion.targetPosition = new THREE.Vector3(params.x, params.y, params.z);
    companion.isMoving = true;
  };

  const lookAt = (companion: Companion, params: { x: number; y: number; z: number }) => {
    companion.targetLook = new THREE.Vector3(params.x, params.y, params.z);
  };

  const performGesture = (companion: Companion, gestureType: string) => {
    companion.currentGesture = gestureType;
    // ジェスチャーアニメーションは簡易実装
    console.log(`${companion.id} が ${gestureType} ジェスチャーを実行`);
  };

  const showSpeechBubble = (companion: Companion, text: string) => {
    if (!companion.vrm || !sceneRef.current) return;
    
    // 既存のフキダシを削除
    if (companion.speechBubble) {
      sceneRef.current.remove(companion.speechBubble);
    }

    // 新しいフキダシを作成
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = 256;
    canvas.height = 128;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "black";
    context.strokeRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    context.font = "16px Arial";
    context.textAlign = "center";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(2, 1);
    const mesh = new THREE.Mesh(geometry, material);

    if (!cameraRef.current) return;
    
    mesh.position.copy(companion.vrm.scene.position);
    mesh.position.y += 3;
    mesh.lookAt(cameraRef.current.position);

    sceneRef.current.add(mesh);
    companion.speechBubble = mesh;

    // 5秒後にフキダシを削除
    setTimeout(() => {
      if (companion.speechBubble && sceneRef.current) {
        sceneRef.current.remove(companion.speechBubble);
        companion.speechBubble = undefined;
      }
    }, 5000);
  };

  const animate = () => {
    requestAnimationFrame(animate);

    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !clockRef.current) return;

    const deltaTime = clockRef.current.getDelta();

    // コンパニオンの更新
    companionsRef.current.forEach((companion) => {
      if (companion.vrm && cameraRef.current) {
        companion.vrm.update(deltaTime);

        // 移動処理
        if (companion.isMoving && companion.targetPosition) {
          const currentPos = companion.vrm.scene.position;
          const targetPos = companion.targetPosition;
          const distance = currentPos.distanceTo(targetPos);

          if (distance > 0.1) {
            const direction = targetPos.clone().sub(currentPos).normalize();
            currentPos.add(direction.multiplyScalar(deltaTime * 2));
          } else {
            companion.isMoving = false;
            companion.targetPosition = undefined;
          }
        }

        // 視線処理
        if (companion.targetLook) {
          companion.vrm.scene.lookAt(companion.targetLook);
          companion.targetLook = undefined;
        }

        // フキダシの向き調整
        if (companion.speechBubble) {
          companion.speechBubble.position.copy(companion.vrm.scene.position);
          companion.speechBubble.position.y += 3;
          companion.speechBubble.lookAt(cameraRef.current.position);
        }
      }
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const registerFurnitureToRegistry = async () => {
    try {
      for (const furniture of furnitureRef.current) {
        const response = await fetch("http://localhost:3000/furniture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: furniture.label,
            x: Math.floor(furniture.position.x),
            y: Math.floor(furniture.position.y),
            z: Math.floor(furniture.position.z),
            roomId: roomId,
          }),
        });

        if (response.ok) {
          console.log(`${furniture.label} をregistryに登録しました`);
        } else {
          console.error(`${furniture.label} の登録に失敗しました`);
        }
      }
      alert("家具をregistryに登録しました！");
    } catch (error) {
      console.error("Registry登録エラー:", error);
      alert("Registry登録に失敗しました");
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* UI コントロール */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-2">AI Companion Visualization</h3>
        
        <div className="mb-2">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></span>
          MQTT: {isConnected ? "接続中" : "切断"}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Room ID:</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
            placeholder="room-id"
          />
        </div>

        <button
          onClick={registerFurnitureToRegistry}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm w-full"
        >
          家具をRegistryに登録
        </button>
      </div>

      {/* 操作説明 */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm">
        <div>マウス: カメラ回転</div>
        <div>ホイール: ズーム</div>
      </div>
    </div>
  );
}