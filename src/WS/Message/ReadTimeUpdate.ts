import {setStoreMessageReadTime} from "~/stores/Readtime";
import {produce} from "solid-js/store";

/**
 * 既読時間を更新する
 * @param dat
 * @constructor
 */
export default function WSReadTimeUpdate(dat: {
  userId: string,
  channelId: string,
  readTime: string
}) {
  //console.log("WSReadTimeUpdate :: triggered dat->", dat);

  //Storeを更新する
  setStoreMessageReadTime(produce((prev) => {
    //ReadTimeStoreにデータがある場合は更新、ない場合は追加
    if (prev.some((rt) => rt.channelId === dat.channelId)) {
      const index = prev.findIndex((rt) => rt.channelId === dat.channelId);
      prev[index].readTime = dat.readTime;
    } else {
      prev.push({
        channelId: dat.channelId,
        readTime: dat.readTime
      });
    }

    return prev;
  }));
}
