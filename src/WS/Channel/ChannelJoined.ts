import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";

export default function WSChannelJoined(dat: { channelId: string }) {
  //console.log("WSChannelJoined :: triggered dat->", dat);

  const myJoinedChannel = storeMyUserinfo.ChannelJoin;
  
  //チャンネル参加を確認して自ユーザーStoreを更新
  if (!myJoinedChannel.some((cj) => cj.channelId === dat.channelId)) {
    setStoreMyUserinfo((prev) => {
      return {
        ...prev,
        ChannelJoin: [...prev.ChannelJoin, { channelId: dat.channelId }],
      };
    });
  }
}
