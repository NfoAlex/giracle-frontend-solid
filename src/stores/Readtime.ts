import { createStore } from "solid-js/store";

export const [storeMessageReadTime, setStoreMessageReadTime] = createStore<
  {
    userId: string;
    channelId: string;
    readTime: Date;
  }[]
>([]);
