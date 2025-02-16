import POST_CHANNEL_GET_HISTORY from "~/api/CHANNEL/CHANNEL_GET_HISTORY";
import { insertHistory, updateHistoryPosition } from "~/stores/History";

let fetching = false;

/**
 * 履歴の取得を行う
 * @param _channelId チャンネルId
 * @param _dat メッセージIdとメッセージ時間指定
 * @param _direction 取得方向
 */
export default async function FetchHistory(
  _channelId: string,
  _dat: {
    messageIdFrom?: string | undefined;
    messageTimeFrom?: string | undefined;
  },
  _direction: "older" | "newer" = "older",
) {
  if (fetching) return;
  fetching = true;
  console.log("FetchHistory :: _dat->", _dat);
  await POST_CHANNEL_GET_HISTORY(
    _channelId,
    _dat.messageIdFrom,
    _dat.messageTimeFrom,
    undefined,
    _direction,
  )
    .then((r) => {
      //console.log("ChannelContent :: fetchHistory : r->", r);
      //if (r.data.history.length === 0) { console.log("ChannelContent :: fetchHistory : 履歴がありません"); return; }
      updateHistoryPosition(_channelId, {
        atEnd: r.data.atEnd,
        atTop: r.data.atTop,
      });
      new Promise((resolve) => {
        insertHistory(r.data.history);
        resolve(null);
      })
    })
    .catch((e) =>
      console.error("ChannelContent :: fetchHistory : エラー->", e),
    );
  
  fetching = false;
}
