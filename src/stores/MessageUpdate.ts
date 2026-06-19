import { createStore } from "solid-js/store";
import { IMessage } from "~/types/Message";

/**
 * WSによるメッセージ更新通知を受け取った際に入るStore
 * コンポーネント上でリアルタイム通信を受ける代わりにこのStoreの値変更でトリガーをかける
 */
export const [storeMessageUpdate, setStoreMessageUpdate] = createStore<
  {
    deleted: IMessage["id"] | undefined,
  }
>({ deleted: undefined });
