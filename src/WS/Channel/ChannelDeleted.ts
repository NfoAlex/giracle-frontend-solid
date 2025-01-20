import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";

export default function WSChannelDeleted(dat: { channelId: string }) {
  console.log("WSChannelDeleted :: triggered dat->", dat);

  const myJoinedChannel = storeMyUserinfo.ChannelJoin;
  
  //チャンネル参加しているなら削除
  if (Object.keys(myJoinedChannel).includes(dat.channelId)) {
    setStoreMyUserinfo((prev) => {
      prev.ChannelJoin.filter((cj) => cj.channelId !== dat.channelId);
      return prev;
    });
  }
}
