import { createStore } from "solid-js/store";
import type { IChannel } from "~/types/Channel";

export const [storeHasNewMessage, setStoreHasNewMessage] = createStore<{[key: IChannel["id"]]: boolean}>({});

/**
 * すべてのチャンネルにおいて未読メッセージがあるかどうか
 * @returns 
 */
export const HasAnythingNew = () => {
  return Object.values(storeHasNewMessage).some((v) => v);
}
