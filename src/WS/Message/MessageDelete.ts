import {
  setStoreHasNewMessage,
  storeHasNewMessage,
} from "~/stores/HasNewMessage.store.ts";
import { setStoreHistory, storeHistory } from "~/stores/History.store.ts";
import { setStoreInbox } from "~/stores/Inbox.store.ts";
import { useStoreMessageFetchCache } from "~/stores/MessageFetchCache.store";
import { storeMessageReadTime } from "~/stores/Readtime.store.ts";
import type { IMessage } from "~/types/Message.ts";

export default function WSMessageDeleted(dat: {
  messageId: IMessage["id"];
  channelId: string;
}) {
  //console.log("WSMessageDeleted :: triggered dat->", dat);

  //履歴から削除
  setStoreHistory((prev) => {
    //console.log("WSMessageDeleted :: setStoreHistory : 削除するメッセ->", prev[dat.channelId].history.find((m) => m.id === dat.messageId));

    //履歴未取得のチャンネルは更新不要
    if (prev[dat.channelId] === undefined) return prev;

    return {
      ...prev,
      [dat.channelId]: {
        ...prev[dat.channelId],
        history: prev[dat.channelId].history.filter(
          (m) => m.id !== dat.messageId,
        ),
      },
    };
  });
  //Inboxから該当メッセージIdを持つものを削除
  setStoreInbox((prev) => {
    return prev.filter((inboxItem) => inboxItem.messageId !== dat.messageId);
  });

  //削除通知受け取り用Storeに格納
  useStoreMessageFetchCache.setAsDeleted(dat.messageId);

  // ------------------- ここから未読が削除された時用の新着削除判別👇 ------------------- //

  //新着が無い、履歴が最後まで無い、あるいはそもそも新着データが無いなら停止
  const isHereNew = storeHasNewMessage[dat.channelId];
  if (
    isHereNew === undefined ||
    !isHereNew ||
    !storeHistory[dat.channelId]?.atEnd
  )
    return;

  //新着表示を消す
  const clearNewMessage = () => {
    setStoreHasNewMessage((prev) => {
      return {
        ...prev,
        [dat.channelId]: false,
      };
    });
  };

  //削除後に履歴が空なら未読は残らないため新着表示を消す
  const latestMessage = storeHistory[dat.channelId].history[0];
  if (latestMessage === undefined) {
    clearNewMessage();
    return;
  }

  //比較に使う既読時間を取得する
  const readTimeHere = storeMessageReadTime.find(
    (m) => m.channelId === dat.channelId,
  )?.readTime;
  if (!readTimeHere) return;

  const readTimeDate = new Date(readTimeHere).valueOf();
  const latestDate = new Date(latestMessage.createdAt).valueOf();
  //時刻が不正で比較不能なら判定しない（新着を消し残す）
  if (Number.isNaN(readTimeDate) || Number.isNaN(latestDate)) return;

  //履歴の最新メッセージが既読時間よりも前なら新着表示を削除
  if (readTimeDate >= latestDate) {
    clearNewMessage();
  }
}
