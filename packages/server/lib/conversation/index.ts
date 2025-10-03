import type { Message, State } from "../../schema/index.js";
import { setsAreEqual } from "../../utils/array.js";
import type { CompanionAgent } from "../agents/index.js";

export interface ITurnTakingManager {
  addPending(message: Message): Promise<void>;
  handleStateReceived(state: State): Promise<void>;
}

export class TurnTakingManager implements ITurnTakingManager {
  private companionAgent: CompanionAgent;
  private pending: Map<
    string,
    { participants: Set<string>; message: Message; states: State[] }
  >;
  private timeoutDuration: number;

  constructor(companionAgent: CompanionAgent, timeoutDuration: number) {
    this.companionAgent = companionAgent;
    this.pending = new Map();
    this.timeoutDuration = timeoutDuration;
  }

  async addPending(message: Message) {
    const participants = new Set(message.params.to);

    this.pending.set(message.params.id, {
      participants,
      message,
      states: [],
    });
  }

  async handleStateReceived(state: State) {
    const messageId = state.params.messageId;
    if (!this.pending.has(messageId)) {
      return;
    }
    const pending = this.pending.get(messageId);
    if (!pending) return;
    pending.states.push(state);
    const voted = new Set<string>();
    pending.states.forEach((state) => {
      voted.add(state.params.from);
    });
    //参加者全員の投票が集まった場合
    if (setsAreEqual(voted, pending.participants)) {
      await this.decideNextSpeaker(messageId, pending.states);
    }
  }

  private async decideNextSpeaker(messageId: string, states: State[]) {
    const selectedAgents = states.filter((state) => state.params.selected);
    if (selectedAgents.length > 0) {
      const speaker = selectedAgents.reduce((prev, current) =>
        prev.params.importance > current.params.importance ? prev : current,
      );
      await this.executeSpeaker(messageId, speaker);
      return;
    }
    const speakAgents = states.filter(
      (state) => state.params.state === "speak",
    );
    if (speakAgents.length > 0) {
      const speaker = speakAgents.reduce((prev, current) =>
        prev.params.importance > current.params.importance ? prev : current,
      );
      await this.executeSpeaker(messageId, speaker);
      return;
    }
    this.pending.delete(messageId);
  }

  private async executeSpeaker(messageId: string, speaker: State) {
    console.log(
      `Speaker selected: ${speaker.params.from} (importance: ${speaker.params.importance})`,
    );
    if (speaker.params.from === this.companionAgent.companion.metadata.id) {
      try {
        const pending = this.pending.get(messageId);
        if (pending) {
          const myState = pending.states.find((state) => {
            return (
              state.params.from === this.companionAgent.companion.metadata.id
            );
          });
          if (myState && myState.params.closing === "terminal") {
            console.log("The conversation is over.");
            return;
          }
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, this.timeoutDuration);
          });
          await this.companionAgent.input(pending.message);
        } else {
          console.warn(
            `Original message not found for messageId: ${messageId}`,
          );
        }
      } catch (error) {
        console.error("Failed to execute speaker logic:", error);
      }
    }
    this.pending.delete(messageId);
  }
}
