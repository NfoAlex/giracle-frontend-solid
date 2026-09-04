import { setStoreChannelInfo } from "~/stores/ChannelInfo.store.ts";
import type { IChannel } from "~/types/Channel.ts";

export default function WSUpdateChannel(dat: IChannel) {
  //console.log("WSUpdateChannel :: triggered dat->", dat);

  //チャンネル情報を更新
  setStoreChannelInfo((prev) => {
    const newState = { ...prev };
    newState[dat.id] = dat;
    return newState;
  });
}
