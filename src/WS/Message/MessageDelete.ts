import {setStoreHistory, storeHistory} from "~/stores/History";
import type {IMessage} from "~/types/Message";

export default function WSMessageDeleted(dat: { messageId: IMessage["id"], channelId: string }) {
  console.log("WSMessageDeleted :: triggered dat->", dat);

  //履歴から削除
  setStoreHistory((prev) => {
    console.log("WSMessageDeleted :: setStoreHistory : 削除するメッセ->", prev[dat.channelId].history.find((m) => m.id === dat.messageId));

    // 新しいオブジェクトを作成して返す
    const newHistory = prev[dat.channelId].history.filter((m) => m.id !== dat.messageId);

    return {
      ...prev,
      [dat.channelId]: {
        ...prev[dat.channelId],
        history: newHistory
      }
    };
  });

  console.log("WSMessageDeleted :: setStoreHistory : 削除するできた？->", storeHistory[dat.channelId].history.find((m) => m.id === dat.messageId));
}
