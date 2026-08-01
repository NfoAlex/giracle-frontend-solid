import { produce } from "solid-js/store";
import { api } from "~/api/index.ts";
import {
  insertHistory,
  setStoreImageDimensions,
  updateHistoryPosition,
} from "~/stores/History.ts";

//履歴取得キュー:取得中のリクエストをチャンネルId＋取得方向ごとに保持する
const fetchQueue = new Map<string, Promise<void>>();

/**
 * 履歴の取得を行う
 * @param _channelId チャンネルId
 * @param _dat メッセージIdとメッセージ時間指定
 * @param _direction 取得方向
 */
export default function FetchHistory(
  _channelId: string,
  _dat: {
    messageIdFrom?: string | undefined;
    messageTimeFrom?: string | undefined;
    fetchLength?: number | undefined;
  },
  _direction: "older" | "newer" = "older",
): Promise<void> {
  //チャンネルと方向が違う取得は互いに巻き添えにしない
  const key = `${_channelId}:${_direction}`;

  //同一キーの取得が進行中なら、捨てずにその完了へ合流させる
  const running = fetchQueue.get(key);
  if (running) return running;

  const task = (async () => {
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
      // エラー発生時も解除を保証して重複取得ブロックの固着を防ぐ
      fetchQueue.delete(key);
    }
  })();

  fetchQueue.set(key, task);
  return task;
}
