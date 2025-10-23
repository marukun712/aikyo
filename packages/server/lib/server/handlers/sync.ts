import type { Message } from "@libp2p/interface";
import type { LoroDoc } from "loro-crdt";
import { logger } from "../../logger.js";

export const handleCRDTSync = async (
  doc: LoroDoc,
  message: CustomEvent<Message>,
) => {
  try {
    const data = message.detail.data;

    if (data && data.length > 0) {
      doc.import(data);
      logger.debug("CRDT update imported successfully");
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
      // ローカルでの変更のみブロードキャスト（importによる変更は除外）
      if (event.by === "local") {
        // 最新の更新をエクスポート
        const updates = doc.export({ mode: "update" });

        publish("crdt-sync", updates);
        logger.debug("CRDT update published");
      }
    } catch (e) {
      logger.error({ err: e }, "Error in CRDT sync handler");
    }
  });
};
