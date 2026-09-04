import { produce } from "solid-js/store";
import { setStoreHasNewMessage } from "~/stores/HasNewMessage.store.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.store.ts";
import { setStoreMessageReadTime } from "~/stores/Readtime.store.ts";

/**
 * 既読時間と新着を更新する
 * @param dat
 * @constructor
 */
export default function WSReadTimeUpdate(dat: {
  userId: string;
  channelId: string;
  readTime: string;
}) {
  //console.log("WSReadTimeUpdate :: triggered dat->", dat);

  //他人の既読なら自未読を消さないため何もしない
  if (dat.userId !== storeMyUserinfo.id) return;

  //Storeを更新する
  setStoreMessageReadTime(
    produce((prev) => {
      //ReadTimeStoreにデータがある場合は更新、ない場合は追加
      if (prev.some((rt) => rt.channelId === dat.channelId)) {
        const index = prev.findIndex((rt) => rt.channelId === dat.channelId);
        prev[index].readTime = dat.readTime;
      } else {
        prev.push({
          channelId: dat.channelId,
          readTime: dat.readTime,
          //既存エントリ無しのため前回値は空
          readTimeBefore: "",
        });
      }

      return prev;
    }),
  );

  //新着Storeを更新
  setStoreHasNewMessage(
    produce((prev) => {
      prev[dat.channelId] = false;
      return prev;
    }),
  );
}
