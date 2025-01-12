import POST_CHANNEL_GET_HISTORY from "~/api/CHANNEL/CHANNEL_GET_HISTORY";
import { insertHistory, updateHistoryPosition } from "~/stores/History";

/**
 * 履歴の取得を行う
 * @param _channelId
 */
export default async function FetchHistory(
  _channelId: string,
  _dat: {
    messageIdFrom?: string | undefined;
    messageTimeFrom?: Date | undefined;
  },
  _direction: "older" | "newer" = "older",
) {
  await POST_CHANNEL_GET_HISTORY(
    _channelId,
    _dat.messageIdFrom,
    _dat.messageTimeFrom?.toDateString(),
    undefined,
    _direction,
  )
    .then((r) => {
      console.log("ChannelContent :: fetchHistory : r->", r);
      updateHistoryPosition(r.data.history[0].channelId, {
        atEnd: r.data.atEnd,
        atTop: r.data.atTop,
      });
      insertHistory(r.data.history);
    })
    .catch((e) =>
      console.error("ChannelContent :: fetchHistory : エラー->", e),
    );
}
