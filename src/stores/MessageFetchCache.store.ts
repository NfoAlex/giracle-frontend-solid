import { createMutable } from "solid-js/store";
import { api } from "~/api/index.ts";
import type { IMessage } from "~/types/Message.ts";
import { storeHistory } from "./History.store.ts";

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

//返信表示用のキャッシュ
const storeMessageFetchCache = createMutable<{
  cache: {
    [messageId: string]: IMessage;
  };
  isDeleted: {
    [messageId: string]: boolean;
  };
}>({ cache: {}, isDeleted: {} });

export namespace useStoreMessageFetchCache {
  export const getMessage = (
    channelId: string,
    messageId: string,
  ): IMessage => {
    if (storeMessageFetchCache.isDeleted[messageId]) return messageHolder;
    if (storeMessageFetchCache.cache[messageId])
      return storeMessageFetchCache.cache[messageId];

    //履歴Storeから探してきてあればそれを返す
    const msgFromStore = storeHistory[channelId]?.history.find(
      (msg) => msg.id === messageId,
    );
    if (msgFromStore) {
      storeMessageFetchCache.cache[messageId] = msgFromStore;
      return storeMessageFetchCache.cache[messageId];
    }

    //表示には適用させるためにawaitしていない
    api.message
      .get({ messageId })
      .then((res) => {
        storeMessageFetchCache.cache[messageId] = res.data;
      })
      .catch(() => {
        storeMessageFetchCache.cache[messageId] = {
          ...messageHolder,
          content: "削除されたメッセージ",
          id: messageId,
          channelId: channelId,
        };
        storeMessageFetchCache.isDeleted[messageId] = true;
        return storeMessageFetchCache.cache[messageId];
      });

    //取得するまでのプレイスホルダー設置
    storeMessageFetchCache.cache[messageId] = {
      ...messageHolder,
      content: "取得中...",
      id: messageId,
      channelId: channelId,
    };
    return storeMessageFetchCache.cache[messageId];
  };

  export const updateMessage = (message: IMessage) => {
    if (storeMessageFetchCache.isDeleted[message.id]) return;
    storeMessageFetchCache.cache[message.id] = {
      ...storeMessageFetchCache.cache[message.id],
      ...message,
    };
  };

  export const getIsDeleted = (messageId: string) => {
    return storeMessageFetchCache.isDeleted[messageId];
  };

  export const setAsDeleted = (messageId: string) => {
    storeMessageFetchCache.cache[messageId] = {
      ...messageHolder,
      content: "削除されたメッセージ",
      id: messageId,
    };
    storeMessageFetchCache.isDeleted[messageId] = true;
  };

  export const clearCache = () => {
    storeMessageFetchCache.cache = {};
    storeMessageFetchCache.isDeleted = {};
  };
}
