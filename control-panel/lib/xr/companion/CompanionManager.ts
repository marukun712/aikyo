import { AgentManager } from "../navigation/NavigationManager";
import { Scene, Vector3 } from "three";
import { VRMLoader } from "../vrm/VRMLoader";
import { VRM } from "@pixiv/three-vrm";
import { GLTF } from "three/examples/jsm/Addons.js";

export interface CompanionManager {
  modelPath: string;
  vrm: VRM | null;
  gltf: GLTF | null;
  agent: AgentManager;
  scene: Scene;
  speak: (text: string) => void;
  spawn: () => Promise<void>;
  walk: (x: number, y: number, z: number) => void;
  lookAt: (x: number, y: number, z: number) => void;
  update: (delta: number) => void;
}

export class CompanionManagerImpl implements CompanionManager {
  modelPath: string;
  vrm: VRM | null = null;
  gltf: GLTF | null = null;
  agent: AgentManager;
  scene: Scene;
  speak: (text: string) => void;

  constructor(
    modelPath: string,
    agent: AgentManager,
    scene: Scene,
    speak: (text: string) => void
  ) {
    this.modelPath = modelPath;
    this.agent = agent;
    this.scene = scene;
    this.speak = speak;
  }

  async spawn() {
    const loader = new VRMLoader();
    const { gltf, vrm } = await loader.load("/AliciaSolid-1.0.vrm");
    this.gltf = gltf;
    this.vrm = vrm;
    this.scene.add(gltf.scene);
  }

  walk(x: number, y: number, z: number) {
    this.agent.moveTo(new Vector3(x, y, z));
  }

  lookAt(x: number, y: number, z: number) {
    if (!this.vrm || !this.gltf) return;
    const target = new Vector3(x, y, z);
    const vrm: VRM = this.gltf.userData.vrm;
    const head = vrm.humanoid.getNormalizedBoneNode("head");
    if (!head) return;
    vrm.lookAt?.lookAt(target);
    const orig = head.quaternion.clone();
    head.lookAt(target);
    const targ = head.quaternion.clone();
    head.quaternion.copy(orig);
    head.quaternion.slerpQuaternions(orig, targ, 0.5);
  }

  talk(text: string) {
    this.speak(text);
  }

  update(delta: number) {
    if (!this.vrm || !this.gltf) return;
    const agent = this.agent.getAgent();
    this.agent.update();
    this.vrm.update(delta);
    this.gltf.scene.position.set(
      agent.position().x,
      agent.position().y,
      agent.position().z
    );
  }
}
