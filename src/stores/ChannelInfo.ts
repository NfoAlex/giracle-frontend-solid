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
 * チャンネル情報を返す。無いなら取得してから返す
 * @param channelId
 */
export const getterChannelInfo = async (
  channelId: string,
): Promise<IChannel> => {
  if (storeChannelInfo[channelId] === undefined) {
    await GET_CHANNEL_GET_INFO(channelId)
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
          isArchived: false,
        });
      });
  }

  return storeChannelInfo[channelId];
};
