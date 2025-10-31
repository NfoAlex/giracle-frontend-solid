import type { IMessage } from "~/types/Message";
import { setStoreHistory } from "~/stores/History";
import { storeReplyDisplayCache } from "~/stores/ReplyDisplayCache";

/**
 * メッセージの更新処理
 * @param dat
 * @constructor
 */
export default function WSUpdateMessage(dat: IMessage) {
  //console.log("WSUpdateMessage :: triggered dat->", dat);

  //履歴に追加
  setStoreHistory((prev) => {
    if (prev[dat.channelId] === undefined) {
      return prev;
    }

    //メッセージを更新
    const newHistory = prev[dat.channelId].history.map((message) => {
      if (message.id === dat.id) {
        return {...message, ...dat};
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

  //返信表示キャッシュの更新
  if (storeReplyDisplayCache.cache[dat.id]) {
    storeReplyDisplayCache.cache[dat.id] = {...storeReplyDisplayCache.cache[dat.id], ...dat};
  }
}
