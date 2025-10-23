import type { LoroDoc } from "loro-crdt";
import z from "zod";
import {
  type Message,
  MessageSchema,
  type State,
  StateSchema,
} from "../../schema/index.js";
import { setsAreEqual } from "../../utils/array.js";
import type { CompanionAgent } from "../agents/index.js";
import { logger } from "../logger.js";

export interface ITurnTakingManager {
  addPending(message: Message): void;
  cancelPending(): void;
  hasPending(): boolean;
  getMessage(): Message | null;
}

export class TurnTakingManager implements ITurnTakingManager {
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

    //配列の更新時に実行される。配列はCRDTで適切にマージされる
    doc.getList("states").subscribe(() => this.onStateUpdated());
    doc.getMap("speaker").subscribe(() => this.onSelectedSpeaker());
  }

  addPending(message: Message) {
    this.doc.getMap("pending").set("current", message);
  }

  //割り込み発話用のキャンセル関数
  cancelPending() {
    if (this.doc.getMap("pending").size > 0) {
      logger.info(
        { pendingCount: this.doc.getMap("pending").size },
        "Canceling pending state aggregation due to new message",
      );
      //全コンパニオン間で配列をclearする
      this.doc.getMap("pending").clear();
      this.doc.getList("states").clear();
      this.abortController.abort();
      this.abortController = new AbortController();
    }
  }

  //すでに待機中のメッセージがあるか
  hasPending() {
    return this.doc.getMap("pending").size > 0;
  }

  //LoroMapからパースして取り出し
  getMessage() {
    const message = this.doc.getMap("pending").get("current");
    const parsedMessage = MessageSchema.safeParse(message);
    if (!parsedMessage.success) {
      return null;
    }
    const pending = parsedMessage.data;
    return pending;
  }

  //LoroListからパースして取り出し
  private getStates() {
    const votedList = this.doc.getList("states").toArray();
    const parsedStates = z.array(StateSchema).safeParse(votedList);
    if (!parsedStates.success) {
      return null;
    }
    const states = parsedStates.data;
    return states;
  }

  private async onStateUpdated() {
    const pending = this.getMessage();
    const states = this.getStates();
    if (!pending || !states) return;

    const voted = new Set<string>();
    states.forEach((state) => {
      voted.add(state.params.from);
    });

    //参加者全員の投票が集まった場合
    if (setsAreEqual(voted, new Set(pending.params.to))) {
      //自分のStateを取得
      const myState = states.find((state) => {
        return state.params.from === this.companionAgent.companion.metadata.id;
      });
      if (!myState) return;
      //closingの確認(terminalなら終了)
      if (myState && myState.params.closing === "terminal") {
        logger.info("The conversation is over");
        return;
      }
      await this.decideNextSpeaker(states);
    }
  }

  //speakerを全コンパニオン間で決定する
  private async decideNextSpeaker(states: State[]) {
    //selected(指名された)コンパニオンがいる場合
    const selectedAgents = states.filter((state) => state.params.selected);
    if (selectedAgents.length > 0) {
      //importanceの最大値をとって最大のコンパニオンをspeakerとする
      const speaker = selectedAgents.sort(
        (a, b) => b.params.importance - a.params.importance,
      );
      //全コンパニオンが同じ値を持つ
      this.doc.getMap("speaker").set("speaker", speaker[0].params.from);
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
      this.doc.getMap("speaker").set("speaker", speaker[0].params.from);
      return;
    }

    //だれも発言の意思がない場合は、会話を終了させる
    this.doc.getMap("pending").delete("current");
  }

  //選出された発言者が実行
  private async onSelectedSpeaker() {
    const speaker = this.doc.getMap("speaker").get("speaker");
    const message = this.getMessage();
    if (!speaker || typeof speaker !== "string" || !message) return;
    logger.info({ speaker }, "Speaker selected");
    if (speaker === this.companionAgent.companion.metadata.id) {
      logger.info("I was selected as the speaker...");
      try {
        //会話のスピードを落とすため任意のタイムアウトをあける
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, this.timeoutDuration);
        });
        //agentにinput
        await this.companionAgent.input(message, {
          signal: this.abortController.signal,
        });
      } catch (error) {
        logger.error({ error }, "Failed to execute speaker logic");
      }
    }
    this.doc.getMap("pending").delete("current");
    this.doc.getList("states").clear();
  }
}
