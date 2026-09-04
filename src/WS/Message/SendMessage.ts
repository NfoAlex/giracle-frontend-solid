import { storeClientConfig } from "~/stores/ClientConfig.store.ts";
import { setStoreHasNewMessage } from "~/stores/HasNewMessage.store.ts";
import { storeHistory, useStoreHistory } from "~/stores/History.store.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.store.ts";
import {
  storeNotificationConfig,
  useStoreNotification,
} from "~/stores/Notification.store.ts";
import type { IMessage } from "~/types/Message.ts";
import { notifyIt } from "~/utils/Notify.ts";
import UpdateReadTimeOnRemoteAndStore from "~/utils/UpdateReadTimeOnRemoteAndStore.util";

export default function WSSendMessage(dat: IMessage) {
  //console.log("WSSendMessage :: triggered dat->", dat);

  //もし受け取ったメッセージのチャンネルにいない、あるいはフォーカスしていないなら新着設定
  if (
    (!location.pathname.includes(dat.channelId) || !document.hasFocus()) &&
    storeMyUserinfo.id !== dat.userId
  ) {
    //console.log("SendMessage :: WSSendMessage : 新着登録");
    setStoreHasNewMessage((hnm) => {
      return {
        ...hnm,
        [dat.channelId]: true,
      };
    });

    //ミュート・通知設定を判定して通知する
    const notifEnabled =
      storeNotificationConfig.enabled && storeNotificationConfig.mode !== "off";
    const wantsAll =
      storeNotificationConfig.mode === "all" ||
      storeClientConfig.notification.notifyAll;
    if (
      notifEnabled &&
      wantsAll &&
      !useStoreNotification.isChannelMuted(dat.channelId)
    ) {
      notifyIt(dat.userId, dat.content, { channelId: dat.channelId });
    }
  } else if (
    storeHistory[dat.channelId]?.atEnd ||
    storeMyUserinfo.id === dat.userId
  ) {
    //それ以外で履歴末端まで行ってるなら既読時間更新
    const updateReadtimeBeforeToo =
      storeMyUserinfo.id === dat.userId || document.hasFocus();
    UpdateReadTimeOnRemoteAndStore(dat.channelId, dat.createdAt, {
      copyToReadTimeBefore: updateReadtimeBeforeToo,
    });
  }

  //履歴に追加
  useStoreHistory.addMessage(dat);
}
