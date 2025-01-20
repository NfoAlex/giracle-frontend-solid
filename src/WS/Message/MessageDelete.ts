import { setStoreHistory } from "~/stores/History";
import type { IMessage } from "~/types/Message";

export default function WSMessageDeleted(dat: { messageId: IMessage["id"], channelId: string }) {
  //console.log("WSMessageDeleted :: triggered dat->", dat);

  //履歴から削除
  setStoreHistory((prev) => {
    const his = prev[dat.channelId].history.filter((m) => m.id !== dat.messageId);
    prev[dat.channelId].history = his;
    return prev;
  });
}
