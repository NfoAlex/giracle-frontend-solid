import { createStore } from "solid-js/store";

//既読時間
export const [storeMessageReadTime, setStoreMessageReadTime] = createStore<
  {
    channelId: string;
    readTime: string;
    readTimeBefore: string;
  }[]
>([]);
