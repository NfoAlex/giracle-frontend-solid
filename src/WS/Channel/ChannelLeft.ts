import { produce } from "solid-js/store";
import {
  setStoreHasNewMessage,
  storeHasNewMessage,
} from "~/stores/HasNewMessage.store.ts";
import { setStoreHistory, storeHistory } from "~/stores/History.store.ts";
import {
  setStoreMyUserinfo,
  storeMyUserinfo,
} from "~/stores/MyUserinfo.store.ts";

export default function WSChannelLeft(dat: { channelId: string }) {
  //履歴削除
  if (storeHistory[dat.channelId] !== undefined) {
    setStoreHistory(
      produce((prev) => {
        delete prev[dat.channelId];
      }),
    );
  }

  //新着削除
  if (storeHasNewMessage[dat.channelId] !== undefined) {
    setStoreHasNewMessage(
      produce((prev) => {
        delete prev[dat.channelId];
      }),
    );
  }

  //未参加なら更新不要
  if (!storeMyUserinfo.ChannelJoin.some((cj) => cj.channelId === dat.channelId))
    return;

  setStoreMyUserinfo("ChannelJoin", (prev) =>
    prev.filter((cj) => cj.channelId !== dat.channelId),
  );
}
