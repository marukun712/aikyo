import type { LoroDoc } from "loro-crdt";
import type { Message, State } from "../../schema/index.js";
import { setsAreEqual } from "../../utils/array.js";
import type { CompanionAgent } from "../agents/index.js";
import { logger } from "../logger.js";

export class TurnTakingManager {
  private doc: LoroDoc;
  private companionAgent: CompanionAgent;
  private timeoutDuration: number;
  private abortController: AbortController;

  constructor(
    doc: LoroDoc,
    companionAgent: CompanionAgent,
    timeoutDuration: number,
  ) {
    this.doc = doc;
    this.companionAgent = companionAgent;
    this.timeoutDuration = timeoutDuration;
    this.abortController = new AbortController();
  }

  async addPending(message: Message) {
    const participants = new Set(
      message.params.to.filter((id) => id.startsWith("companion_")),
    );

    this.doc.getMap("pending").set(message.params.id, {
      participants,
      message,
      states: [],
    });
  }

  cancelPending(): void {
    if (this.doc.getMap("pending").size > 0) {
      logger.info(
        { pendingCount: this.doc.getMap("pending").size },
        "Canceling pending state aggregation due to new message",
      );
      this.doc.getMap("pending").clear();
      this.abortController.abort();
      this.abortController = new AbortController();
    }
  }

  hasPending(): boolean {
    return this.doc.getMap("pending").size > 0;
  }

  async handleStateReceived(state: State) {
    const messageId = state.params.messageId;
    const pending = this.doc.getMap("pending").get(messageId);
    if (!pending) {
      return;
    }
    if (!pending) return;
    pending.states.push(state);
    const voted = new Set<string>();
    pending.states.forEach((state) => {
      voted.add(state.params.from);
    });
    logger.info({ pending });
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
        id: speaker.params.from,
      },
      "Speaker selected",
    );
    if (speaker.params.from === this.companionAgent.companion.metadata.id) {
      logger.info(
        {
          importance: speaker.params.importance,
        },
        "I was selected as the speaker...",
      );
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
          await this.companionAgent.input(pending.message, {
            signal: this.abortController.signal,
          });
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
