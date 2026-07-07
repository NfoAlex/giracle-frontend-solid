import { api } from "~/api/index.ts";
import { storeClientConfig } from "~/stores/ClientConfig.ts";
import { storeHistory } from "~/stores/History.ts";
import {setStoreInbox} from "~/stores/Inbox.ts";
import {
  isChannelMuted,
  storeNotificationConfig,
} from "~/stores/Notification.ts";
import type {IInbox, IMessage} from "~/types/Message.ts";
import { notifyIt } from "~/utils/Notify.ts";

export default function WSInboxAdded(dat: { type: IInbox["type"], message: IMessage }) {
  //Giracleにフォーカスされているかどうか
  const hasFocus = document.hasFocus();
  //履歴Storeにメンションされているメッセージが既にフェッチされているかどうか
  const alreadyHasMessage = storeHistory[dat.message.channelId]?.history.some((msg) => msg.id === dat.message.id) ?? false;
  //メンションされたチャンネルに今いるかどうか
  const onSameChannel = location.pathname.endsWith("/channel/" + dat.message.channelId);
  //フォーカスされていない かつ 通知設定OK かつ 該当チャンネルがミュートされていないなら通知
  const notifEnabled =
    storeNotificationConfig.enabled && storeNotificationConfig.mode !== "off";
  const wantsInbox =
    notifEnabled ||
    (storeClientConfig.notification.notifyInbox &&
      !storeClientConfig.notification.notifyAll);
  if (
    !hasFocus &&
    wantsInbox &&
    !isChannelMuted(dat.message.channelId)
  ) {
    //通知内容
    let notifyingContent = dat.message.content;
    //返信なら特別表示に装飾
    if (dat.type === "reply") {
      notifyingContent = "あなたへの返信 : \n" + dat.message.content;
    }
    notifyIt(dat.message.userId, notifyingContent, { channelId: dat.message.channelId });
  }

  //今メンションされたチャンネルにいてかつ履歴にあるのなら既読処理、違うならInbox格納
  if (onSameChannel && alreadyHasMessage) {
    api.message.inboxRead({ messageId: dat.message.id }).then(() => {
      //console.log("MentionReadWrapper :: onMounted : message read");
    }).catch((e) => console.error("WSInboxAdded : 既読error->", e));
  } else {
    //InboxStore更新
    setStoreInbox((prev) => {
      const newItem: IInbox = {
        messageId: dat.message.id,
        type: dat.type,
        userId: "",
        Message: dat.message,
        happendAt: dat.message.createdAt
      }
      return [...prev, newItem];
    });
  }

}