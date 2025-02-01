import { createStore } from "solid-js/store";
import GET_CHANNEL_GET_INFO from "~/api/CHANNEL/CHANNEL_GET_INFO";
import type { IChannel } from "~/types/Channel";

export const [storeChannelInfo, setStoreChannelInfo] = createStore<{
  [key: string]: IChannel;
}>({});

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
export const directGetterChannelInfo = (
  channelId: string,
): IChannel => {
  if (storeChannelInfo[channelId] === undefined) {
    updateChannelInfo({
      name: "ロード中...",
      id: channelId,
      description: "このチャンネルはロード中です",
      createdUserId: "",
      ChannelViewableRole: [],
      isArchived: false,
    });
    GET_CHANNEL_GET_INFO(channelId)
      .then((r) => {
        //Storeに設定
        updateChannelInfo(r.data);
      })
      .catch((e) => {
        console.error("ChannelInfo :: getterChannelInfo : エラー -> ", e);
        updateChannelInfo({
          name: "存在しないチャンネル",
          id: channelId,
          description: "存在しないチャンネル",
          createdUserId: "",
          ChannelViewableRole: [],
          isArchived: false,
        });
      });
  }

  return storeChannelInfo[channelId];
};
