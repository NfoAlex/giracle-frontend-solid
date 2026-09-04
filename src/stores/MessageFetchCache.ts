import { createMutable } from "solid-js/store";
import { api } from "~/api/index.ts";
import type { IMessage } from "~/types/Message.ts";
import { storeHistory } from "./History.ts";

const MAX_CACHE_ENTRIES = 750;

const messageHolder: IMessage = {
  channelId: "",
  content: "",
  isEdited: false,
  createdAt: "",
  id: "",
  isSystemMessage: false,
  userId: "UNKNOWN",
  replyingMessageId: null,
  MessageUrlPreview: [],
  MessageFileAttached: [],
  reactionSummary: [],
};

//返信表示用のキャッシュ(Mapは挿入順保持で、FIFO削除のため)
const storeMessageFetchCache = createMutable<{
  cache: Map<string, IMessage>;
  isDeleted: Map<string, boolean>;
}>({ cache: new Map(), isDeleted: new Map() });

const trimMap = <T>(map: Map<string, T>) => {
  while (map.size > MAX_CACHE_ENTRIES) {
    map.delete(map.keys().next().value as string);
  }
};

export const fnMessageFetchCache = {
  getMessage: (channelId: string, messageId: string): IMessage => {
    if (storeMessageFetchCache.isDeleted.get(messageId)) return messageHolder;
    const cached = storeMessageFetchCache.cache.get(messageId);
    if (cached) return cached;

    //履歴Storeから探してきてあればそれを返す
    const msgFromStore = storeHistory[channelId]?.history.find(
      (msg) => msg.id === messageId,
    );
    if (msgFromStore) {
      storeMessageFetchCache.cache.set(messageId, msgFromStore);
      trimMap(storeMessageFetchCache.cache);
      return msgFromStore;
    }

    //表示には適用させるためにawaitしていない
    api.message
      .get({ messageId })
      .then((res) => {
        storeMessageFetchCache.cache.set(messageId, res.data);
        trimMap(storeMessageFetchCache.cache);
      })
      .catch(() => {
        storeMessageFetchCache.cache.set(messageId, {
          ...messageHolder,
          content: "削除されたメッセージ",
          id: messageId,
          channelId: channelId,
        });
        trimMap(storeMessageFetchCache.cache);
        storeMessageFetchCache.isDeleted.set(messageId, true);
        trimMap(storeMessageFetchCache.isDeleted);
      });

    //取得するまでのプレイスホルダー設置
    const placeholder: IMessage = {
      ...messageHolder,
      content: "取得中...",
      id: messageId,
      channelId: channelId,
    };
    storeMessageFetchCache.cache.set(messageId, placeholder);
    trimMap(storeMessageFetchCache.cache);
    return placeholder;
  },

  updateMessage: (message: IMessage) => {
    if (storeMessageFetchCache.isDeleted.get(message.id)) return;
    storeMessageFetchCache.cache.set(message.id, {
      ...storeMessageFetchCache.cache.get(message.id),
      ...message,
    });
    trimMap(storeMessageFetchCache.cache);
  },

  getIsDeleted: (messageId: string) => {
    return storeMessageFetchCache.isDeleted.get(messageId);
  },

  setAsDeleted: (messageId: string) => {
    storeMessageFetchCache.cache.set(messageId, {
      ...messageHolder,
      content: "削除されたメッセージ",
      id: messageId,
    });
    trimMap(storeMessageFetchCache.cache);
    storeMessageFetchCache.isDeleted.set(messageId, true);
    trimMap(storeMessageFetchCache.isDeleted);
  },

  clearCache: () => {
    storeMessageFetchCache.cache.clear();
    storeMessageFetchCache.isDeleted.clear();
  },
};
