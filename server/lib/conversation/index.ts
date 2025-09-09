import type { Message, Metadata, State } from "../../schema/index.ts";
import type { CompanionAgent } from "../agents/index.ts";

export class TurnTakingManager {
  private companionAgent: CompanionAgent;
  private companionId: string;
  private companionList: Map<string, Metadata>;
  private pendingMessage: Map<string, State[]>;
  private originalMessages: Map<string, Message>;

  constructor(
    companionAgent: CompanionAgent,
    companionId: string,
    companionList: Map<string, Metadata>,
    pendingMessage: Map<string, State[]>,
    originalMessages: Map<string, Message>,
  ) {
    this.companionAgent = companionAgent;
    this.companionId = companionId;
    this.companionList = companionList;
    this.pendingMessage = pendingMessage;
    this.originalMessages = originalMessages;
  }

  async handleStateReceived(state: State) {
    const messageId = state.messageId;
    if (!this.pendingMessage.has(messageId)) {
      this.pendingMessage.set(messageId, []);
    }
    const states = this.pendingMessage.get(messageId);
    if (!states) return;
    states.push(state);
    const expectedStates = this.companionList.size;
    if (states.length === expectedStates) {
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
    this.originalMessages.delete(messageId);
    this.pendingMessage.delete(messageId);
  }

  private async executeSpeaker(messageId: string, speaker: State) {
    if (speaker.id === this.companionId) {
      try {
        const originalMessage = this.originalMessages.get(messageId);
        if (originalMessage) {
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 5000);
          });
          await this.companionAgent.input(originalMessage);
        }
      } catch (error) {
        console.error("Failed to execute speaker logic:", error);
      }
    }
    this.originalMessages.delete(messageId);
    this.pendingMessage.delete(messageId);
  }
}
