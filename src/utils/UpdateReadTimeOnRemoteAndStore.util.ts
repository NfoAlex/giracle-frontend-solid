import { api } from "~/api/index.ts";
import {
  setStoreMessageReadTime,
  storeMessageReadTime,
} from "~/stores/Readtime.store.ts";

function BindToReadTimeStore(
  channelId: string,
  readTime: string,
  currentReadTime?: string,
  option?: { copyToReadTimeBefore: boolean },
) {
  // Store 更新のログを出力
  console.log(
    "UpdateReadTimeOnRemoteAndStore :: BindToReadTimeStore : called->",
    channelId,
    readTime,
    currentReadTime,
    option,
  );
  setStoreMessageReadTime((prev) => {
    const newReadTime = {
      channelId: channelId,
      readTime: readTime,
      readTimeBefore: option?.copyToReadTimeBefore
        ? readTime
        : (currentReadTime ?? readTime),
    };
    const newStore = prev.filter((c) => c.channelId !== channelId);
    newStore.push({ ...newReadTime });
    return newStore;
  });
}

/**
 * 既読時間をローカルStoreとサーバーで更新させる
 * @param dat 更新に参照するメッセージデータ
 */
export default async function UpdateReadTimeOnRemoteAndStore(
  channelId: string,
  messageCreatedAt: string,
  option?: { copyToReadTimeBefore: boolean },
) {
  //console.log("UpdateReadTimeOnRemoteAndStore :: called->", { channelId, messageCreatedAt, option });

  const currentReadTime = storeMessageReadTime.find((readTimeJson) => {
    return readTimeJson.channelId === channelId;
  })?.readTime;

  //既読時間が現時点で無いなら更新して終了
  if (currentReadTime === undefined) {
    BindToReadTimeStore(channelId, messageCreatedAt);
    await api.message
      .updateReadTime({
        channelId,
        readTime: messageCreatedAt,
      })
      .catch((err) => {
        console.error("UpdateReadTimeOnRemoteAndStore :: err->", err);
      });

    return;
  }

  //ローカルがすでに新しいなら停止
  if (
    new Date(currentReadTime).valueOf() >= new Date(messageCreatedAt).valueOf()
  ) {
    return;
  }

  BindToReadTimeStore(channelId, messageCreatedAt, currentReadTime, option);
  await api.message
    .updateReadTime({
      channelId,
      readTime: messageCreatedAt,
    })
    .catch((err) => {
      console.error("UpdateReadTimeOnRemoteAndStore :: err->", err);
    });
}
