import POST_MESSAGE_INBOX_READ from "~/api/MESSAGE/MESSAGE_INBOX_READ";
import { storeClientConfig } from "~/stores/ClientConfig";
import { storeHistory } from "~/stores/History";
import {setStoreInbox} from "~/stores/Inbox";
import type {IInbox, IMessage} from "~/types/Message";
import { notifyIt } from "~/utils/Notify";

export default function WSInboxAdded(dat: { type: IInbox["type"], message: IMessage }) {
  //Giracleにフォーカスされているかどうか
  const hasFocus = document.hasFocus();
  //履歴Storeにメンションされているメッセージが既にフェッチされているかどうか
  const alreadyHasMessage = storeHistory[dat.message.channelId].history.some((msg) => msg.id === dat.message.id);
  //メンションされたチャンネルに今いるかどうか
  const onSameChannel = location.pathname.endsWith("/channel/" + dat.message.channelId);

  //フォーカスされていないなら通知する
  if (!hasFocus && storeClientConfig.notification.enabled) {
    notifyIt(dat.message.userId, dat.message.content);
  }

  //今メンションされたチャンネルにいてかつ履歴にあるのなら既読処理、違うならInbox格納
  if (onSameChannel && alreadyHasMessage) {
    POST_MESSAGE_INBOX_READ(dat.message.id).then(() => {
      //console.log("MentionReadWrapper :: onMounted : message read");
    }).catch((e) => console.error("WSInboxAdded : 既読error->", e));
  } else {
    //InboxStore更新
    setStoreInbox((prev) => {
      const newItem: IInbox = {
        messageId: dat.message.id,
        type: "mention",
        userId: "",
        Message: dat.message,
        happendAt: dat.message.createdAt
      }
      return [...prev, newItem];
    });
  }

}