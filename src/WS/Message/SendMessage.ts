import { setStoreHasNewMessage, storeHasNewMessage } from "~/stores/HasNewMessage";
import { addMessage, storeHistory } from "~/stores/History";
import type { IMessage } from "~/types/Message";

export default function WSSendMessage(dat: IMessage) {
  console.log("WSSendMessage :: triggered dat->", dat, location.pathname);

  //履歴に追加
  addMessage(dat);

  //もし受け取ったメッセージのチャンネルにいないなら新着設定
  if (!location.pathname.includes(dat.channelId)) {
    setStoreHasNewMessage((hnm) => {
      return {
        ...hnm,
        [dat.channelId]: true,
      };
    });
  }
}
