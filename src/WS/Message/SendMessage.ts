import { setStoreHasNewMessage } from "~/stores/HasNewMessage";
import { addMessage } from "~/stores/History";
import { storeMyUserinfo } from "~/stores/MyUserinfo";
import { setStoreMessageReadTimeBefore } from "~/stores/Readtime";
import type { IMessage } from "~/types/Message";

export default function WSSendMessage(dat: IMessage) {
  //console.log("WSSendMessage :: triggered dat->", dat);

  //履歴に追加
  addMessage(dat);

  //自分のメッセージなら時差表示用既読時間を更新
  if (storeMyUserinfo.id === dat.userId) {
    setStoreMessageReadTimeBefore((prev) => {
      const newReadTime = { channelId: dat.channelId, readTime: dat.createdAt };
      const newStore = prev.filter((c) => c.channelId !== dat.channelId);
      newStore.push(newReadTime);
      return newStore;
    });
  };

  //もし受け取ったメッセージのチャンネルにいない、あるいはフォーカスしていないなら新着設定
  if (!location.pathname.includes(dat.channelId) || !document.hasFocus()) {
    setStoreHasNewMessage((hnm) => {
      return {
        ...hnm,
        [dat.channelId]: true,
      };
    });
  }
}
