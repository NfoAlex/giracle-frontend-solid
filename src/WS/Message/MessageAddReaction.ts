import type {IReaciton} from "~/types/Message.ts"
import {setStoreHistory} from "~/stores/History.ts";
import {produce} from "solid-js/store";
import {storeMyUserinfo} from "~/stores/MyUserinfo.ts";

export default function WSMessageAddReaction(dat: IReaciton) {
  //console.log("WSMessageAddReaction :: triggered dat->", dat);

  //履歴Storeのメッセージデータ更新
  setStoreHistory(produce((prev) => {
    const his = prev[dat.channelId].history;
    const index = his.findIndex((m) => m.id === dat.messageId);
    if (index === -1) return;
    if (!his[index].reactionSummary) his[index].reactionSummary = [];

    //既にリアクションがあるかどうかを確認
    const reactionNow = his[index].reactionSummary.find((r) => r.emojiCode === dat.emojiCode);
    //同じリアクションがあれば増やす、無ければ追加
    if (reactionNow !== undefined) {
      reactionNow.count++;
      //自分が含まれているかどうかでデータ更新
      if (storeMyUserinfo.id === dat.userId) reactionNow.includingYou = true;
    } else {
      his[index].reactionSummary.push({
        emojiCode: dat.emojiCode,
        count: 1,
        includingYou: storeMyUserinfo.id === dat.userId
      });
    }

    return {
      ...prev,
      [dat.channelId]: {
        ...prev[dat.channelId],
        history: his
      }
    };
  }));
}