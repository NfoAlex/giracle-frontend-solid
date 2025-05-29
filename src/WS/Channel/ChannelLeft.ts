import { setStoreHasNewMessage, storeHasNewMessage } from "~/stores/HasNewMessage";
import { setStoreHistory, storeHistory } from "~/stores/History";
import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";

export default function WSChannelLeft(dat: { channelId: string }) {
  console.log("WSChannelLeft :: triggered dat->", dat);

  const myJoinedChannel = storeMyUserinfo.ChannelJoin;

  //履歴Storeから対象チャンネル分を削除
  if (storeHistory[dat.channelId] !== undefined) {
    setStoreHistory((prev) => {
      const newHistory = { ...prev };
      delete newHistory[dat.channelId];
      return newHistory;
    });
  }
  //未読メッセージ通知Storeから対象チャンネル分を削除
  if (storeHasNewMessage[dat.channelId] !== undefined) {
    setStoreHasNewMessage((prev) => {
      const newHasNewMessage = { ...prev };
      delete newHasNewMessage[dat.channelId];
      return {
        ...newHasNewMessage
      };
    });
  }
  
  //チャンネル参加しているなら削除
  if (myJoinedChannel.map(cj => cj.channelId).includes(dat.channelId)) {
    setStoreMyUserinfo((prev) => {
      const ChannelJoinFiltered = prev.ChannelJoin.filter((cj) => cj.channelId !== dat.channelId);
      return {
        ...prev,
        ChannelJoin: ChannelJoinFiltered,
      };
    });
  }
}
