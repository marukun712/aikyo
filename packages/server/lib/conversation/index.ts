import type { Message, State } from "../../schema/index.js";
import type { CompanionAgent } from "../agents/index.js";
import { logger } from "../logger.js";

export interface ITurnTakingManager {
  addPending(message: Message): Promise<void>;
  handleStateReceived(state: State): Promise<void>;
}

export class TurnTakingManager implements ITurnTakingManager {
  private companionAgent: CompanionAgent;
  private participants: Set<string>;
  private states: Map<string, State>;
  private timeoutDuration: number;

  constructor(companionAgent: CompanionAgent, timeoutDuration: number) {
    this.companionAgent = companionAgent;
    this.participants = new Set();
    this.states = new Map();
    this.timeoutDuration = timeoutDuration;
  }

  async addPending(message: Message) {
    const participants = new Set(
      message.params.to.filter((id) => id.startsWith("companion_")),
    );
    this.participants = participants;
  }

  async handleStateReceived(state: State) {
    this.states.set(state.params.from, state);
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
        await this.companionAgent.generate();
      } catch (error) {
        logger.error({ error }, "Failed to execute speaker logic");
      }
    }
  }
}
