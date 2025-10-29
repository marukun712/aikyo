import { EventEmitter } from "node:events";
import { Queue, Worker } from "bullmq";
import type { LoroMap } from "loro-crdt";
import type { Message, State } from "../../schema/index.js";

export interface ITurnTakingManager {
  add(message: Message): Promise<void>;
}

export class TurnTakingManager
  extends EventEmitter
  implements ITurnTakingManager
{
  private states: LoroMap;
  private queue: Queue;

  constructor(states: LoroMap) {
    super();
    this.states = states;
    this.queue = new Queue("Turn");
    new Worker("Turn", async (job) => {
      const states: State[] = job.data.params.to.map((id: string) => {
        return this.states.get(id);
      });
      const speaker = this.decideNextSpeaker(states);
      if (!speaker) return;
      this.emit("selected", speaker);
    });
  }

  async add(message: Message) {
    this.queue.add(message.params.id, message);
  }

  private async decideNextSpeaker(states: State[]) {
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
