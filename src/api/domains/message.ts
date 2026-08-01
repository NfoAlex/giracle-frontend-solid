import type { IChannel } from "~/types/Channel.ts";
import type { IInbox, IMessage, IReaciton } from "~/types/Message.ts";
import { FETCH_CLIENT } from "../FETCH_CLIENT.ts";

export const message = {
  delete: (p: { messageId: string }) =>
    FETCH_CLIENT<{ message: `Message deleted`; data: string }>({
      url: "/api/message/delete",
      method: "DELETE",
      body: { messageId: p.messageId },
      label: "MESSAGE_DELETE",
    }),

  deleteEmojiReaction: (p: {
    messageId: string;
    channelId: string;
    emojiCode: string;
  }) =>
    FETCH_CLIENT<{ message: `Message reacted.`; data: IReaciton }>({
      url: "/api/message/delete-emoji-reaction",
      method: "DELETE",
      body: {
        messageId: p.messageId,
        channelId: p.channelId,
        emojiCode: p.emojiCode,
      },
      label: "MESSAGE_DELETE_EMOJI_REACTION",
    }),

  edit: (p: { messageId: string; message: string }) =>
    FETCH_CLIENT<{ message: `Message edited`; data: IMessage }>({
      url: "/api/message/edit",
      method: "POST",
      body: { messageId: p.messageId, message: p.message },
      label: "MESSAGE_EDIT",
    }),

  emojiReaction: (p: {
    messageId: string;
    channelId: string;
    emojiCode: string;
  }) =>
    FETCH_CLIENT<{ message: `Message reacted.`; data: IReaciton }>({
      url: "/api/message/emoji-reaction",
      method: "POST",
      body: {
        messageId: p.messageId,
        channelId: p.channelId,
        emojiCode: p.emojiCode,
      },
      label: "MESSAGE_EMOJI_REACTION",
    }),

  // TODO: File を JSON.stringify に含めているため実際には送信されない（既存バグ）。
  // バックエンド仕様未確認のため現行実装を踏襲。呼び出し箇所は現状無し。
  fileUpload: (p: { channelId: string; file: File }) =>
    FETCH_CLIENT<{ message: `File uploaded`; data: { fileId: string } }>({
      url: "/api/message/file/upload",
      method: "POST",
      body: { channelId: p.channelId, file: p.file },
      label: "MESSAGE_FILE_UPLOAD",
    }),

  get: (p: { messageId: string }) =>
    FETCH_CLIENT<{ message: "Fetched message"; data: IMessage }>({
      url: `/api/message/${p.messageId}`,
      method: "GET",
      label: "MESSAGE_GET",
    }),

  getNew: () =>
    FETCH_CLIENT<{
      message: "Fetched news";
      data: { [key: IChannel["id"]]: boolean };
    }>({
      url: "/api/message/get-new",
      method: "GET",
      label: "MESSAGE_GET_NEW",
    }),

  getReadTime: () =>
    FETCH_CLIENT<{
      message: "Fetched read time";
      data: { userId: string; channelId: string; readTime: string }[];
    }>({
      url: "/api/message/read-time/get",
      method: "GET",
      label: "MESSAGE_GET_READTIME",
    }),

  inbox: () =>
    FETCH_CLIENT<{ message: "Fetched inbox"; data: IInbox[] }>({
      url: "/api/message/inbox",
      method: "GET",
      label: "MESSAGE_INBOX",
    }),

  inboxRead: (p: { messageId: string }) =>
    FETCH_CLIENT<{ message: `Inbox read`; data: string }>({
      url: "/api/message/inbox/read",
      method: "POST",
      body: { messageId: p.messageId },
      label: "MESSAGE_INBOX_READ",
    }),

  search: (p: {
    content?: string;
    channelId?: string;
    userId?: string;
    hasUrlPreview?: boolean;
    hasFileAttachment?: boolean;
    loadIndex?: number;
    sort?: "asc" | "desc";
  }) => {
    // 元実装の truthy チェック（空文字は除外）を踏襲するため独自にクエリ文字列を構築する
    const query = new URLSearchParams();
    if (p.content) query.set("content", p.content);
    if (p.channelId) query.set("channelId", p.channelId);
    if (p.userId) query.set("userId", p.userId);
    if (p.hasUrlPreview !== undefined)
      query.set("hasUrlPreview", String(p.hasUrlPreview));
    if (p.hasFileAttachment !== undefined)
      query.set("hasFileAttachment", String(p.hasFileAttachment));
    if (p.loadIndex !== undefined) query.set("loadIndex", String(p.loadIndex));
    if (p.sort) query.set("sort", p.sort);

    return FETCH_CLIENT<{ message: `Searched messages`; data: IMessage[] }>({
      url: `/api/message/search?${query.toString()}`,
      method: "GET",
      label: "MESSAGE_SEARCH",
    });
  },

  send: (p: {
    channelId: string;
    message: string;
    fileIds: string[];
    replyingMessageId?: string;
  }) =>
    FETCH_CLIENT<{ message: `Message sent`; data: IMessage }>({
      url: "/api/message/send",
      method: "POST",
      body: {
        channelId: p.channelId,
        message: p.message,
        fileIds: p.fileIds,
        replyingMessageId: p.replyingMessageId,
      },
      label: "MESSAGE_SEND",
    }),

  updateReadTime: (p: { channelId: string; readTime: string }) =>
    FETCH_CLIENT<{ message: `Message sent`; data: IMessage }>({
      url: "/api/message/read-time/update",
      method: "POST",
      body: { channelId: p.channelId, readTime: p.readTime },
      label: "MESSAGE_UPDATE_READTIME",
    }),

  whoReacted: (p: { messageId: string; emojiCode: string; cursor?: number }) =>
    FETCH_CLIENT<{ message: "Fetched reactions"; data: string[] }>({
      url: `/api/message/who-reacted?messageId=${p.messageId}&emojiCode=${p.emojiCode}&cursor=${p.cursor ?? 1}`,
      method: "GET",
      label: "MESSAGE_WHO_REACTED",
    }),
};
