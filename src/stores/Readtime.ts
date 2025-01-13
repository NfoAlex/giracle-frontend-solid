import { createStore } from "solid-js/store";

export const [storeMessageReadTime, setStoreMessageReadTime] = createStore<
  {
    channelId: string;
    readTime: Date;
  }[]
>([]);

/**
 * 既読時間を更新
 * @param channelId 
 * @param readTime 
 */
export const updateReadTime = (channelId: string, readTime: Date) => {
  setStoreMessageReadTime((prev) => {
    const newReadTime = { channelId, readTime };
    const newStore = prev.filter((c) => c.channelId !== channelId);
    newStore.push(newReadTime);
    return newStore;
  });
}
