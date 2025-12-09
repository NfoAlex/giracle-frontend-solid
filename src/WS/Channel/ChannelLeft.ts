import { setStoreHasNewMessage, storeHasNewMessage } from "~/stores/HasNewMessage.ts";
import { setStoreHistory, storeHistory } from "~/stores/History.ts";
import { produce } from "solid-js/store";
import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo.ts";

export default function WSChannelLeft(dat: { channelId: string }) {
  //console.log("WSChannelLeft :: triggered dat->", dat);

  const myJoinedChannel = storeMyUserinfo.ChannelJoin;

  //履歴Storeから対象チャンネル分を削除
  if (storeHistory[dat.channelId] !== undefined) {
    setStoreHistory(produce((prev) => {
      delete prev[dat.channelId];
      return prev;
    }));
  }
  //未読メッセージ通知Storeから対象チャンネル分を削除
  if (storeHasNewMessage[dat.channelId] !== undefined) {
    setStoreHasNewMessage(produce((prev) => {
      delete prev[dat.channelId];
      return prev;
    }));
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
