import { setStoreHistory, storeHistory } from "~/stores/History.ts";
import type { IMessage } from "~/types/Message.ts";
import { storeMessageReadTime } from "~/stores/Readtime.ts";
import { setStoreHasNewMessage, storeHasNewMessage } from "~/stores/HasNewMessage.ts";
import { storeReplyDisplayCache } from "~/stores/ReplyDisplayCache.ts";
import { setStoreInbox } from "~/stores/Inbox.ts";
import { fnMessageFetchCache } from "~/stores/MessageFetchCache";

export default function WSMessageDeleted(dat: { messageId: IMessage["id"], channelId: string }) {
  //console.log("WSMessageDeleted :: triggered dat->", dat);

  //履歴から削除
  setStoreHistory((prev) => {
    //console.log("WSMessageDeleted :: setStoreHistory : 削除するメッセ->", prev[dat.channelId].history.find((m) => m.id === dat.messageId));

    try {
      // 新しいオブジェクトを作成して返す
      const newHistory = prev[dat.channelId].history.filter((m) => m.id !== dat.messageId);

      return {
        ...prev,
        [dat.channelId]: {
          ...prev[dat.channelId],
          history: newHistory
        }
      };
    } catch (e) {
      return prev;
    }
  });
  //Inboxから該当メッセージIdを持つものを削除
  setStoreInbox((prev) => {
    return prev.filter((inboxItem) => inboxItem.messageId !== dat.messageId);
  });

  //返信表示のキャッシュから削除、削除フラグも立てる
  storeReplyDisplayCache.cache[dat.messageId] && delete storeReplyDisplayCache.cache[dat.messageId];
  storeReplyDisplayCache.isDeleted[dat.messageId] = true;
  //削除通知受け取り用Storeに格納
  fnMessageFetchCache.setAsDeleted(dat.messageId);

  // ------------------- ここから未読が削除された時用の新着削除判別👇 ------------------- //

  //新着が無い、履歴が最後まで無い、あるいはそもそも新着データが無いなら停止
  const isHereNew = storeHasNewMessage[dat.channelId];
  if (isHereNew === undefined || !isHereNew || !storeHistory[dat.channelId]?.atEnd) return;

  //比較に使う既読時間を取得する
  const readTimeHere = storeMessageReadTime.find((m) => m.channelId === dat.channelId)?.readTime;
  if (!readTimeHere) return;
  //既読時間をDate型に変換
  const readTimeHereDateObj = new Date(readTimeHere);

  //履歴の最新メッセージが既読時間よりも前なら新着表示を削除
  if (readTimeHereDateObj.valueOf() >= new Date(storeHistory[dat.channelId].history[0]?.createdAt).valueOf()) {
    setStoreHasNewMessage((prev) => {
      return {
        ...prev,
        [dat.channelId]: false
      }
    });
  }
}
