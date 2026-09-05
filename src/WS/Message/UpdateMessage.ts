import { setStoreHistory } from "~/stores/History.store.ts";
import { useStoreMessageFetchCache } from "~/stores/MessageFetchCache.store";
import type { IMessage } from "~/types/Message";

/**
 * メッセージの更新処理
 * @param dat
 * @constructor
 */
export default function WSUpdateMessage(dat: {
  id: string,
  content: string,
  channelId: string,
  userId: string,
  isEdited: boolean,
  MessageUrlPreview?: IMessage["MessageUrlPreview"]
}) {
  //console.log("WSUpdateMessage :: triggered dat->", dat);

  //履歴に追加
  setStoreHistory((prev) => {
    if (prev[dat.channelId] === undefined) {
      return prev;
    }

    //メッセージを更新
    const newHistory = prev[dat.channelId].history.map((message) => {
      if (message.id === dat.id) {
        return { ...message, ...dat };
      } else {
        return message;
      }
    });

    return {
      ...prev,
      [dat.channelId]: {
        ...prev[dat.channelId],
        history: newHistory,
      },
    };
  });

  //キャッシュ更新
  useStoreMessageFetchCache.updateMessage(dat);
}
