import type { Message } from "@libp2p/interface";
import type { LoroDoc } from "loro-crdt";
import { logger } from "../../logger";

//配列の変更時に自動的にGossipsubでブロードキャスト/CRDTでマージする
export const handleCRDTSync = async (
  doc: LoroDoc,
  message: CustomEvent<Message>,
) => {
  try {
    const data = message.detail.data;
    if (data && data.length > 0) {
      doc.import(data);
    }
  } catch (e) {
    logger.error({ err: e }, "Error handling CRDT sync message");
  }
};

export const setupCRDTSync = (
  doc: LoroDoc,
  publish: (topic: string, data: Uint8Array) => void,
) => {
  // LoroDocの変更を監視
  doc.subscribe((event) => {
    try {
      // ローカルでの変更のみブロードキャスト
      if (event.by === "local") {
        // 最新の更新をエクスポート
        const updates = doc.export({ mode: "update" });
        publish("crdt-sync", updates);
      }
    } catch (e) {
      logger.error({ err: e }, "Error in CRDT sync handler");
    }
  });
};
