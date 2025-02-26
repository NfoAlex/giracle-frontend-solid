import type {IReaciton} from "~/types/Message"
import {setStoreHistory} from "~/stores/History";
import {produce} from "solid-js/store";
import {storeMyUserinfo} from "~/stores/MyUserinfo";

export default function WSMessageDeleteReaction(dat: IReaciton) {
  console.log("WSMessageDeleteReaction :: triggered dat->", dat);

  //履歴Storeのメッセージデータ更新
  setStoreHistory(produce((prev) => {
    const his = prev[dat.channelId].history;
    const index = his.findIndex((m) => m.id === dat.messageId);
    if (index === -1) return;
    if (!his[index].reactionSummary) return;

    //リアクションがあるかどうかを確認、無ければ停止
    const reactionNow = his[index].reactionSummary.find((r) => r.emojiCode === dat.emojiCode);
    if (reactionNow === undefined) return;

    //リアクション数が1ならリアクションデータを削除、それ以外ならカウントを減らすだけ
    if (reactionNow.count === 1) {
      his[index].reactionSummary = his[index].reactionSummary.filter((r) => r.emojiCode !== dat.emojiCode);

      return {
        ...prev,
        [dat.channelId]: {
          ...prev[dat.channelId],
          history: his
        }
      };
    } else {
      reactionNow.count--;

      return {
        ...prev,
        [dat.channelId]: {
          ...prev[dat.channelId],
          history: his
        }
      };
    }
  }));
}