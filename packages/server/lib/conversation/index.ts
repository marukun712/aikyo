import type { LoroDoc } from "loro-crdt";
import type { Message, State } from "../../schema/index.js";
import { setsAreEqual } from "../../utils/array.js";
import type { CompanionAgent } from "../agents/index.js";
import { logger } from "../logger.js";

interface PendingData {
  participants: Set<string>;
  message: Message;
  states: State[];
}

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

    this.doc.subscribe((event) => {
      // importによる変更のみ処理
      if (event.by === "import") {
        // statesリストへの追加を検出
        for (const containerEvent of event.events) {
          const target = containerEvent.target;
          // statesリストの変更を確認
          if (Array.isArray(target) && target[0] === "states") {
            logger.debug("States list updated via CRDT sync");
            // 最新のstateを取得して処理
            const statesList = this.doc.getList("states");
            if (statesList.length > 0) {
              const latestState = statesList.get(
                statesList.length - 1,
              ) as State;
              this.handleStateReceived(latestState);
            }
          }

          // pendingマップの変更を確認
          if (Array.isArray(target) && target[0] === "pending") {
            logger.debug("Pending map updated via CRDT sync");
            // pendingマップの変更時に投票の集計をトリガー
            this.checkPendingStates();
          }
        }
      }
    });
  }

  private checkPendingStates() {
    const pendingMap = this.doc.getMap("pending");
    const keys = Array.from(pendingMap.keys());

    for (const messageId of keys) {
      const pending = pendingMap.get(messageId) as PendingData | undefined;
      if (!pending) continue;

      const voted = new Set<string>();
      pending.states.forEach((state: State) => {
        voted.add(state.params.from);
      });

      if (setsAreEqual(voted, pending.participants)) {
        this.decideNextSpeaker(messageId, pending.states);
      }
    }
  }

  async addPending(message: Message) {
    const participants = new Set(
      message.params.to.filter((id) => id.startsWith("companion_")),
    );

    const pendingData: PendingData = {
      participants,
      message,
      states: [],
    };

    this.doc.getMap("pending").set(message.params.id, pendingData);
    logger.debug(
      { messageId: message.params.id, participantsCount: participants.size },
      "Added pending message",
    );
  }

  /**
   * すべてのpending状態をキャンセル
   * 新しいメッセージが到着した際などに使用
   */
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

  /**
   * pending状態が存在するかチェック
   */
  hasPending(): boolean {
    return this.doc.getMap("pending").size > 0;
  }

  /**
   * 受信したStateを処理
   * pendingマップに投票を追加し、全員の投票が揃ったら次の発言者を決定
   */
  async handleStateReceived(state: State) {
    const messageId = state.params.messageId;
    const pending = this.doc.getMap("pending").get(messageId) as
      | PendingData
      | undefined;

    if (!pending) {
      logger.debug({ messageId }, "No pending data found for state");
      return;
    }

    // 状態を追加
    pending.states.push(state);

    // 投票したコンパニオンの集合を作成
    const voted = new Set<string>();
    pending.states.forEach((s) => {
      voted.add(s.params.from);
    });

    logger.info(
      {
        messageId,
        votedCount: voted.size,
        requiredCount: pending.participants.size,
      },
      "State received",
    );

    // 参加者全員の投票が集まった場合
    if (setsAreEqual(voted, pending.participants)) {
      await this.decideNextSpeaker(messageId, pending.states);
    }
  }

  /**
   * 次の発言者を決定する
   * 優先順位: 1. 指名されたコンパニオン 2. 発言意思のあるコンパニオン
   * いずれもimportanceスコアで最終決定
   */
  private async decideNextSpeaker(messageId: string, states: State[]) {
    // selected(指名された)コンパニオンがいる場合
    const selectedAgents = states.filter((state) => state.params.selected);
    if (selectedAgents.length > 0) {
      // importanceの最大値をとって最大のコンパニオンをspeakerとする
      const speaker = selectedAgents.sort(
        (a, b) => b.params.importance - a.params.importance,
      );
      await this.executeSpeaker(messageId, speaker[0]);
      return;
    }

    // speakの意思を持っているコンパニオンがいる場合
    const speakAgents = states.filter(
      (state) => state.params.state === "speak",
    );
    if (speakAgents.length > 0) {
      // importanceの最大値をとって最大のコンパニオンをspeakerとする
      const speaker = speakAgents.sort(
        (a, b) => b.params.importance - a.params.importance,
      );
      await this.executeSpeaker(messageId, speaker[0]);
      return;
    }

    // だれも発言の意思がない場合は、会話を終了させる
    logger.info({ messageId }, "No speakers available, ending conversation");
    this.doc.getMap("pending").delete(messageId);
  }

  /**
   * 選出された発言者が実行
   */
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
        // 反応すべきメッセージを取得
        const pending = this.doc.getMap("pending").get(messageId) as
          | PendingData
          | undefined;

        if (pending) {
          const myState = pending.states.find((state) => {
            return (
              state.params.from === this.companionAgent.companion.metadata.id
            );
          });

          // closingの確認(terminalなら終了)
          if (myState && myState.params.closing === "terminal") {
            logger.info("The conversation is over");
            return;
          }

          // 会話のスピードを落とすため任意のタイムアウトをあける
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, this.timeoutDuration);
          });

          // agentにinput
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

    this.doc.getMap("pending").delete(messageId);
  }
}
