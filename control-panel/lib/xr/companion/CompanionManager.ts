import { GLTF } from "three/examples/jsm/Addons.js";
import { AgentManager } from "../navgation/NavigationManager";

interface CompanionManager {
  gltf: GLTF;
  agent: AgentManager;
}
