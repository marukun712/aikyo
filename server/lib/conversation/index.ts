import type { Message, State } from "../../schema/index.ts";
import { arrayToSet, setsAreEqual } from "../../utils/array.ts";
import type { CompanionAgent } from "../agents/index.ts";

export class TurnTakingManager {
  private companionAgent: CompanionAgent;
  private pending: Map<
    string,
    { participants: Set<string>; message: Message; states: State[] }
  >;

  constructor(companionAgent: CompanionAgent) {
    this.companionAgent = companionAgent;
    this.pending = new Map();
  }

  async addPending(message: Message) {
    const participants = arrayToSet(message.to);

    this.pending.set(message.id, {
      participants,
      message,
      states: [],
    });
  }

  async handleStateReceived(state: State) {
    const messageId = state.messageId;
    if (!this.pending.has(messageId)) {
      return;
    }
    const pending = this.pending.get(messageId);
    if (!pending) return;
    pending.states.push(state);
    console.log(
      `State received for message ${messageId}. Total states: ${pending.states.length}`,
    );
    const voted = new Set<string>();
    pending.states.forEach((state) => {
      voted.add(state.id);
    });
    //参加者全員の投票が集まった場合
    if (setsAreEqual(voted, pending.participants)) {
      console.log(
        `All states collected for message ${messageId}. Deciding next speaker.`,
      );
      await this.decideNextSpeaker(messageId, pending.states);
    }
  }

  private async decideNextSpeaker(messageId: string, states: State[]) {
    const selectedAgents = states.filter((state) => state.selected);
    if (selectedAgents.length > 0) {
      const speaker = selectedAgents.reduce((prev, current) =>
        prev.importance > current.importance ? prev : current,
      );
      await this.executeSpeaker(messageId, speaker);
      return;
    }
    const speakAgents = states.filter((state) => state.state === "speak");
    if (speakAgents.length > 0) {
      const speaker = speakAgents.reduce((prev, current) =>
        prev.importance > current.importance ? prev : current,
      );
      await this.executeSpeaker(messageId, speaker);
      return;
    }
    this.pending.delete(messageId);
    console.log(`No speaker found for message ${messageId}. Cleaning up.`);
  }

  private async executeSpeaker(messageId: string, speaker: State) {
    console.log(
      `Speaker selected: ${speaker.id} (importance: ${speaker.importance})`,
    );
    if (speaker.id === this.companionAgent.companion.metadata.id) {
      try {
        console.log("I was selected to speak. Executing input logic...");
        const pending = this.pending.get(messageId);
        if (pending) {
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, 5000);
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
