import type { Message, Metadata, State } from "../../schema/index.ts";
import type { CompanionAgent } from "../agents/index.ts";

export class TurnTakingManager {
  private companionAgent: CompanionAgent;
  private companionList: Map<string, Metadata>;
  private states: Map<string, State[]>;
  private pending: Map<string, Message>;

  constructor(
    companionAgent: CompanionAgent,
    companionList: Map<string, Metadata>,
  ) {
    this.companionAgent = companionAgent;
    this.companionList = companionList;
    this.states = new Map();
    this.pending = new Map();
  }

  async addPending(message: Message) {
    this.pending.set(message.id, message);
  }

  async handleStateReceived(state: State) {
    const messageId = state.messageId;
    if (!this.states.has(messageId)) {
      this.states.set(messageId, []);
    }
    const states = this.states.get(messageId);
    if (!states) return;
    states.push(state);
    console.log(states, this.companionList.size);
    console.log(
      `State received for message ${messageId}. Total states: ${states.length}`,
    );
    const expectedStates = this.companionList.size;
    if (states.length === expectedStates) {
      console.log(
        `All states collected for message ${messageId}. Deciding next speaker.`,
      );
      await this.decideNextSpeaker(messageId, states);
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
    this.states.delete(messageId);
    console.log(`No speaker found for message ${messageId}. Cleaning up.`);
  }

  private async executeSpeaker(messageId: string, speaker: State) {
    console.log(
      `Speaker selected: ${speaker.id} (importance: ${speaker.importance})`,
    );
    if (speaker.id === this.companionAgent.companion.metadata.id) {
      try {
        console.log("I was selected to speak. Executing input logic...");
        const originalMessage = this.pending.get(messageId);
        if (originalMessage) {
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, 5000);
          });
          await this.companionAgent.input(originalMessage);
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
    this.states.delete(messageId);
  }
}
