import { createStore } from "solid-js/store";
import { HttpError } from "~/api/FETCH_CLIENT.ts";
import { api } from "~/api/index.ts";
import type { IChannel } from "~/types/Channel.ts";

export const [storeChannelInfo, setStoreChannelInfo] = createStore<{
  [key: string]: IChannel;
}>({});

export const [storeChannelFetchStatus, setStoreChannelFetchStatus] =
  createStore<{
    [key: string]: "AVAILABLE" | "NOT_FOUND" | "LOADING" | "ERROR_INTERNAL";
  }>({});

//一時的失敗の連続回数。上限に達したら再取得を打ち切る(即時再取得を許すと描画ごとのfetchストームになる)
const MAX_RETRY_COUNT = 3;
//channelIdごとの連続一時失敗回数
const retryFailCounts = new Map<string, number>();

/**
 * チャンネル情報Storeの値を更新/挿入する
 * @param value 挿入/更新するチャンネルデータ。
 */
export const updateChannelInfo = (value: IChannel) => {
  //チャンネル情報をコピーして追記or書き換え
  const _channelInfo = { ...storeChannelInfo };
  _channelInfo[value.id] = value;
  //storeへ格納
  setStoreChannelInfo({
    ..._channelInfo,
  });
};

/**
 * チャンネル情報を同期で返す。無いなら取得しつつ返す
 * @param channelId
 */
export const directGetterChannelInfo = (channelId: string): IChannel => {
  //一時的失敗が上限回数未満の間のみ再取得する
  const failCount = retryFailCounts.get(channelId) ?? 0;

  if (
    storeChannelInfo[channelId] === undefined ||
    failCount < MAX_RETRY_COUNT
  ) {
    setStoreChannelFetchStatus({
      ...storeChannelFetchStatus,
      [channelId]: "LOADING",
    });
    updateChannelInfo({
      name: "ロード中...",
      id: channelId,
      description: "このチャンネルはロード中です",
      createdUserId: "",
      ChannelViewableRole: [],
      isArchived: false,
    });
    api.channel
      .getInfo({ channelId })
      .then((r) => {
        //Storeに設定
        updateChannelInfo(r.data);
        retryFailCounts.delete(channelId);
        setStoreChannelFetchStatus({
          ...storeChannelFetchStatus,
          [channelId]: "AVAILABLE",
        });
      })
      .catch((e) => {
        console.error("ChannelInfo :: getterChannelInfo : エラー -> ", e);
        if (e instanceof HttpError && e.status === 404) {
          //本物の404(存在しない)は再取得不要なので確定させる
          retryFailCounts.delete(channelId);
          updateChannelInfo({
            name: "存在しないチャンネル",
            id: channelId,
            description: "存在しないチャンネル",
            createdUserId: "",
            ChannelViewableRole: [],
            isArchived: false,
          });
          setStoreChannelFetchStatus({
            ...storeChannelFetchStatus,
            [channelId]: "NOT_FOUND",
          });
        } else {
          //一時的な失敗はプレースホルダを保持し、上限回数未満なら次回呼び出しで再試行
          retryFailCounts.set(channelId, failCount + 1);
          setStoreChannelFetchStatus({
            ...storeChannelFetchStatus,
            [channelId]: "ERROR_INTERNAL",
          });
        }
      });
  }

  return storeChannelInfo[channelId];
};
