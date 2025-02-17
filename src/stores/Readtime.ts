import { createStore } from "solid-js/store";

//既読時間
export const [storeMessageReadTime, setStoreMessageReadTime] = createStore<
  {
    channelId: string;
    readTime: string;
  }[]
>([]);
//更新前のを表示するためのやつ
export const [storeMessageReadTimeBefore, setStoreMessageReadTimeBefore] = createStore<
  {
    channelId: string;
    readTime: string;
  }[]
>([]);

/**
 * 既読時間を更新
 * @param channelId 
 * @param readTime 
 */
export const updateReadTime = (channelId: string, readTime: string) => {
  setStoreMessageReadTime((prev) => {
    const newReadTime = { channelId, readTime };
    const newStore = prev.filter((c) => c.channelId !== channelId);
    newStore.push({...newReadTime});
    return newStore;
  });
}
