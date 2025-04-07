import { storeClientConfig } from "~/stores/ClientConfig";
import { setStoreHasNewMessage } from "~/stores/HasNewMessage";
import { addMessage } from "~/stores/History";
import { setStoreMessageReadTimeBefore } from "~/stores/Readtime";
import type { IMessage } from "~/types/Message";
import { notifyIt } from "~/utils/Notify";

export default function WSSendMessage(dat: IMessage) {
  //console.log("WSSendMessage :: triggered dat->", dat);

  //履歴に追加
  addMessage(dat);

  //もし受け取ったメッセージのチャンネルにいない、あるいはフォーカスしていないなら新着設定
  if (!location.pathname.includes(dat.channelId) || !document.hasFocus()) {
    setStoreHasNewMessage((hnm) => {
      return {
        ...hnm,
        [dat.channelId]: true,
      };
    });

    //設定で有効になっているなら通知する
    if (storeClientConfig.notification.notifyAll) {
      //console.log("WSSendMessage :: notifyIt ->", dat.userId, dat.content);
      notifyIt(dat.userId, dat.content);
    }
  } else { //普通にアクティブなら時差表示用既読時間を更新
    setStoreMessageReadTimeBefore((prev) => {
      const newReadTime = { channelId: dat.channelId, readTime: dat.createdAt };
      const newStore = prev.filter((c) => c.channelId !== dat.channelId);
      newStore.push(newReadTime);
      return newStore;
    });
  }
}
