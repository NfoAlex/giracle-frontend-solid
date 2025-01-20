import { setStoreChannelInfo } from "~/stores/ChannelInfo";
import type { IChannel } from "~/types/Channel";

export default function WSUpdateChannel(dat: IChannel) {
  console.log("WSUpdateChannel :: triggered dat->", dat);

  //チャンネル情報を更新
  setStoreChannelInfo((prev) => {
    prev[dat.id] = dat;
    return prev;
  });
}
