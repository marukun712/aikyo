import type { Message, State } from "../../schema/index.js";
import { setsAreEqual } from "../../utils/array.js";
import type { CompanionAgent } from "../agents/index.js";
import { logger } from "../logger.js";

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
    const participants = new Set(
      message.params.to.filter((id) => id.startsWith("companion_")),
    );

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
    //selected(指名された)コンパニオンがいる場合
    const selectedAgents = states.filter((state) => state.params.selected);
    if (selectedAgents.length > 0) {
      //importanceの最大値をとって最大のコンパニオンをspeakerとする
      const speaker = selectedAgents.sort(
        (a, b) => b.params.importance - a.params.importance,
      );
      await this.executeSpeaker(messageId, speaker[0]);
      return;
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
      await this.executeSpeaker(messageId, speaker[0]);
      return;
    }

    //だれも発言の意思がない場合は、会話を終了させる
    this.pending.delete(messageId);
  }

  //選出された発言者が実行
  private async executeSpeaker(messageId: string, speaker: State) {
    logger.info(
      {
        importance: speaker.params.importance,
      },
      "I was selected as the speaker...",
    );
    if (speaker.params.from === this.companionAgent.companion.metadata.id) {
      try {
        //反応すべきメッセージを取得
        const pending = this.pending.get(messageId);
        if (pending) {
          const myState = pending.states.find((state) => {
            return (
              state.params.from === this.companionAgent.companion.metadata.id
            );
          });
          //closingの確認(terminalなら終了)
          if (myState && myState.params.closing === "terminal") {
            logger.info("The conversation is over");
            return;
          }
          //会話のスピードを落とすため任意のタイムアウトをあける
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, this.timeoutDuration);
          });
          //agentにinput
          await this.companionAgent.input(pending.message);
        } else {
          logger.warn(
            { messageId },
            "Original message not found for messageId",
          );
        }
      } catch (error) {
        logger.error({ error }, "Failed to execute speaker logic");
      }
    }
    this.pending.delete(messageId);
  }
}
