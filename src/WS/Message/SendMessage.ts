import { storeClientConfig } from "~/stores/ClientConfig.ts";
import { setStoreHasNewMessage } from "~/stores/HasNewMessage.ts";
import { addMessage, storeHistory } from "~/stores/History.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";
import { setStoreMessageReadTime } from "~/stores/Readtime";
import type { IMessage } from "~/types/Message.ts";
import { notifyIt } from "~/utils/Notify.ts";
import UpdateReadTimeOnRemoteAndStore from "~/utils/UpdateReadTimeOnRemoteAndStore.util";

export default function WSSendMessage(dat: IMessage) {
  //console.log("WSSendMessage :: triggered dat->", dat);

  //もし受け取ったメッセージのチャンネルにいない、あるいはフォーカスしていないなら新着設定
  if ((!location.pathname.includes(dat.channelId) || !document.hasFocus()) && storeMyUserinfo.id !== dat.userId) {
    //console.log("SendMessage :: WSSendMessage : 新着登録");
    setStoreHasNewMessage((hnm) => {
      return {
        ...hnm,
        [dat.channelId]: true,
      };
    });

    //設定で有効になっているなら通知する
    if (storeClientConfig.notification.notifyAll) {
      //console.log("WSSendMessage :: notifyIt ->", dat.userId, dat.content);
      notifyIt(dat.userId, dat.content, { channelId: dat.channelId });
    }
  } else if (storeHistory[dat.channelId]?.atEnd || storeMyUserinfo.id === dat.userId) { //それ以外で履歴末端まで行ってるなら既読時間更新
    const updateReadtimeBeforeToo = storeMyUserinfo.id === dat.userId || document.hasFocus();
    UpdateReadTimeOnRemoteAndStore(dat.channelId, dat.createdAt, { copyToReadTimeBefore: updateReadtimeBeforeToo });
  }

  //履歴に追加
  addMessage(dat);
}
