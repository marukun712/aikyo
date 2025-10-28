import type { Message, State } from "../../schema/index.js";
import type { CompanionAgent } from "../agents/index.js";
import { logger } from "../logger.js";

export interface ITurnTakingManager {
  addPending(message: Message): Promise<void>;
  handleStateReceived(state: State): Promise<void>;
  isCurrentMessage(messageId: string): boolean;
}

export class TurnTakingManager implements ITurnTakingManager {
  private companionAgent: CompanionAgent;
  private participants: Set<string>;
  private states: Map<string, State>;
  private timeoutDuration: number;
  private messageQueue: Message[] = [];
  private currentConversation: {
    message: Message;
    participants: Set<string>;
  } | null = null;
  private processing = false;
  private onProcessingStarted?: (message: Message) => Promise<void>;

  constructor(
    companionAgent: CompanionAgent,
    timeoutDuration: number,
    onProcessingStarted?: (message: Message) => Promise<void>,
  ) {
    this.companionAgent = companionAgent;
    this.participants = new Set();
    this.states = new Map();
    this.timeoutDuration = timeoutDuration;
    this.onProcessingStarted = onProcessingStarted;
  }

  async addPending(message: Message) {
    //Messageをキューに追加
    this.messageQueue.push(message);
    logger.info(
      { messageId: message.params.id, queueLength: this.messageQueue.length },
      "Message added to queue",
    );

    //処理中でなければ次のMessageを処理
    if (!this.processing) {
      await this.processNextMessage();
    }
  }

  private async processNextMessage() {
    //キューが空なら何もしない
    if (this.messageQueue.length === 0) {
      this.processing = false;
      return;
    }

    //処理開始
    this.processing = true;
    const message = this.messageQueue.shift();
    if (!message) return;
    const participants = new Set(
      message.params.to.filter((id) => id.startsWith("companion_")),
    );

    this.currentConversation = { message, participants };
    this.participants = participants;
    this.states.clear();

    logger.info(
      {
        messageId: message.params.id,
        from: message.params.from,
        participants: Array.from(participants),
      },
      "Processing message",
    );

    //コールバックを呼び出し（refresh()とState publishを実行）
    if (this.onProcessingStarted) {
      await this.onProcessingStarted(message);
    }
  }

  async handleStateReceived(state: State) {
    //現在の会話に関係ないStateは無視
    if (!this.currentConversation) {
      logger.debug(
        { from: state.params.from },
        "Received state but no conversation in progress",
      );
      return;
    }

    this.states.set(state.params.from, state);
    logger.info(
      {
        from: state.params.from,
        state: state.params.state,
        importance: state.params.importance,
        collected: this.states.size,
        required: this.participants.size,
      },
      "State received",
    );

    //全参加者のStateが揃ったか確認
    const allStatesCollected = Array.from(this.participants).every((id) =>
      this.states.has(id),
    );

    if (allStatesCollected) {
      logger.info("All states collected, deciding next speaker");
      await this.decideNextSpeaker(Array.from(this.states.values()));
    }
  }

  private async decideNextSpeaker(states: State[]) {
    //selected(指名された)コンパニオンがいる場合
    const selectedAgents = states.filter((state) => state.params.selected);
    if (selectedAgents.length > 0) {
      //importanceの最大値をとって最大のコンパニオンをspeakerとする
      const speaker = selectedAgents.sort(
        (a, b) => b.params.importance - a.params.importance,
      );
      await this.executeSpeaker(speaker[0]);
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
      await this.executeSpeaker(speaker[0]);
      return;
    }
  }

  //選出された発言者が実行
  private async executeSpeaker(speaker: State) {
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
        //closingの確認(terminalなら終了)
        const myState = this.states.get(
          this.companionAgent.companion.metadata.id,
        );
        if (myState && myState.params.closing === "terminal") {
          logger.info("The conversation is over");
          this.finishCurrentConversation();
          return;
        }
        //会話のスピードを落とすため任意のタイムアウトをあける
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, this.timeoutDuration);
        });
        //agentにinput
        await this.companionAgent.generate();
      } catch (error) {
        logger.error({ error }, "Failed to execute speaker logic");
      } finally {
        //会話完了後、次のMessageを処理
        this.finishCurrentConversation();
      }
    } else {
      //他のコンパニオンが選出された場合も、次のMessageを処理
      this.finishCurrentConversation();
    }
  }

  private finishCurrentConversation() {
    logger.info("Finishing current conversation");
    this.states.clear();
    this.currentConversation = null;
    //次のMessageを処理
    this.processNextMessage();
  }

  isCurrentMessage(messageId: string): boolean {
    return this.currentConversation?.message.params.id === messageId;
  }
}
