import { EventEmitter } from "node:events";
import type { LoroMap } from "loro-crdt";
import { type Message, type State, StateSchema } from "../../schema/index.js";

export interface ITurnTakingManager {
  set(message: Message): Promise<void>;
}

export class TurnTakingManager
  extends EventEmitter
  implements ITurnTakingManager
{
  private states: LoroMap;
  private message: LoroMap;

  constructor(states: LoroMap, messages: LoroMap) {
    super();
    this.states = states;
    this.message = messages;
  }

  async set(message: Message) {
    this.message.set("current", message);
    setTimeout(() => {
      const states = message.params.to
        .map((id) => {
          return this.getState(id);
        })
        .filter((state) => state !== null);
      const speaker = this.decideNextSpeaker(states);
      if (speaker) this.emit("selected", speaker);
    }, 500);
  }

  private getState(id: string) {
    const raw = this.states.get(id);
    const parsed = StateSchema.safeParse(raw);
    if (!parsed.success) return null;
    return parsed.data;
  }

  private decideNextSpeaker(states: State[]) {
    //selected(指名された)コンパニオンがいる場合
    const selectedAgents = states.filter((state) => state.params.selected);
    if (selectedAgents.length > 0) {
      //importanceの最大値をとって最大のコンパニオンをspeakerとする
      const speaker = selectedAgents.sort(
        (a, b) => b.params.importance - a.params.importance,
      );
      return speaker[0];
    }

    //speakの意思を持っているコンパニオンがいる場合
    const speakAgents = states.filter(
      (state) => state.params.state === "speak",
    );
    if (speakAgents.length > 0) {
      //importanceの最大値をとって最大のコンパニオンをspeakerとする
      const speaker = speakAgents.sort(
        (a, b) => b.params.importance - a.params.importance,
      );
      return speaker[0];
    }
  }
}
