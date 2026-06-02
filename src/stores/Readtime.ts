import { createStore } from "solid-js/store";

//既読時間
export const [storeMessageReadTime, setStoreMessageReadTime] = createStore<
  {
    channelId: string;
    readTime: string;
    readTimeBefore: string;
  }[]
>([]);

/**
 * 既読時間を更新
 * @param channelId
 * @param readTime
 */
export const updateReadTime = (channelId: string, readTime: string) => { }
