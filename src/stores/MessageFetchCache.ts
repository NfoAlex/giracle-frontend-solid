import { createMutable } from "solid-js/store";
import GET_MESSAGE_GET from "~/api/MESSAGE/MESSAGE_GET";
import type { IMessage } from "~/types/Message.ts";

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
  reactionSummary: []
};

//返信表示用のキャッシュ
const storeMessageFetchCache = createMutable<
  {
    cache: {
      [messageId: string]: IMessage
    },
    isDeleted: {
      [messageId: string]: boolean
    }
  }
>({ cache: {}, isDeleted: {} });

export const fnMessageFetchCache = {
  getMessage: (channelId: string, messageId: string): IMessage => {
    if (storeMessageFetchCache.isDeleted[messageId]) return messageHolder;
    if (storeMessageFetchCache.cache[messageId]) return storeMessageFetchCache.cache[messageId];

    //表示には適用させるためにawaitしていない
    GET_MESSAGE_GET(messageId)
      .then((res) => {
        storeMessageFetchCache.cache[messageId] = res.data;
      })
      .catch(() => {
        storeMessageFetchCache.cache[messageId] = {
          ...messageHolder,
          content: "削除されたメッセージ",
          id: messageId,
          channelId: channelId
        };
        storeMessageFetchCache.isDeleted[messageId] = true;
        return storeMessageFetchCache.cache[messageId];
      });

    //取得するまでのプレイスホルダー設置
    storeMessageFetchCache.cache[messageId] = {
      ...messageHolder,
      content: "取得中...",
      id: messageId,
      channelId: channelId
    };
    return storeMessageFetchCache.cache[messageId];
  },

  updateMessage: (message: IMessage) => {
    if (storeMessageFetchCache.isDeleted[message.id]) return;
    storeMessageFetchCache.cache[message.id] = { ...storeMessageFetchCache.cache[message.id], ...message };
  },

  getIsDeleted: (messageId: string) => {
    return storeMessageFetchCache.isDeleted[messageId];
  },

  setAsDeleted: (messageId: string) => {
    storeMessageFetchCache.cache[messageId] = {
      ...messageHolder,
      content: "削除されたメッセージ",
      id: messageId,
    };
    storeMessageFetchCache.isDeleted[messageId] = true;
  }
}
