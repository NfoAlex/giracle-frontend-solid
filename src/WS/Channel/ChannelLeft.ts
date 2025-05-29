import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";

export default function WSChannelLeft(dat: { channelId: string }) {
  console.log("WSChannelLeft :: triggered dat->", dat);

  const myJoinedChannel = storeMyUserinfo.ChannelJoin;
  
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
