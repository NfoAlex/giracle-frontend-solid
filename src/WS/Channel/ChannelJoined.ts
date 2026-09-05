import { setStoreMyUserinfo } from "~/stores/MyUserinfo.store.ts";

export default function WSChannelJoined(dat: { channelId: string }) {
  // setter内判定→連続受信race防止
  setStoreMyUserinfo("ChannelJoin", (prev) =>
    prev.some((cj) => cj.channelId === dat.channelId)
      ? prev
      : [...prev, { channelId: dat.channelId }],
  );
}
