import { produce } from "solid-js/store";
import { api } from "~/api/index.ts";
import { insertHistory, setStoreImageDimensions, updateHistoryPosition } from "~/stores/History.ts";

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
    fetchLength?: number | undefined;
  },
  _direction: "older" | "newer" = "older",
) {
  if (fetching) return;
  fetching = true;
  // エラー発生時も fetching フラグの解除を保証して重複取得ブロックの固着を防ぐ
  try {
    const response = await api.channel.getHistory({
      channelId: _channelId,
      messageIdFrom: _dat.messageIdFrom,
      messageTimeFrom: _dat.messageTimeFrom,
      fetchLength: _dat.fetchLength,
      fetchDirection: _direction,
    });
    updateHistoryPosition(_channelId, {
      atEnd: response.data.atEnd,
      atTop: response.data.atTop,
    });
    setStoreImageDimensions(
      produce((prev) => Object.assign(prev, response.data.ImageDimensions)),
    );
    insertHistory(response.data.history);
  } catch (error) {
    console.error("ChannelContent :: fetchHistory : エラー->", error);
  } finally {
    fetching = false;
  }
}
