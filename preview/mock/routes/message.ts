import { Buffer } from "node:buffer";
import type {
  IInbox,
  IMessage,
  IMessageFileAttached,
} from "../../../src/types/Message.ts";
import { json, type MockRoute, text } from "../http.ts";
import { serializeMessage, userById, uuid } from "../store.ts";

const obj = (body: unknown): Record<string, unknown> =>
  body !== null && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

export const routes: MockRoute[] = [
  {
    method: "POST",
    pattern: /^\/api\/message\/send$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const channelId = String(b.channelId ?? "");
      const content = typeof b.message === "string" ? b.message : "";
      const replyingMessageId =
        typeof b.replyingMessageId === "string" && b.replyingMessageId !== ""
          ? b.replyingMessageId
          : null;
      const fileIds = Array.isArray(b.fileIds)
        ? b.fileIds.filter((f): f is string => typeof f === "string")
        : [];

      const id = uuid();
      const message: IMessage = {
        id,
        channelId,
        content,
        userId: ctx.userId,
        createdAt: new Date().toISOString(),
        isEdited: false,
        isSystemMessage: false,
        replyingMessageId,
        MessageUrlPreview: [],
        MessageFileAttached: fileIds
          .map((fileId) => ctx.store.files[fileId])
          .filter((f): f is IMessageFileAttached => f !== undefined)
          .map((f) => ({ ...f, messageId: id, channelId })),
        reactionSummary: [],
      };
      ctx.store.messages.push(message);
      ctx.hub.broadcast("message::SendMessage", serializeMessage(message, ""));

      const happendAt = new Date().toISOString();
      const notified = new Set<string>();
      for (const match of content.matchAll(/@<([a-f0-9-]+)>/g)) {
        const uid = match[1];
        if (uid === ctx.userId || userById(uid) === undefined) continue;
        if (notified.has(uid)) continue;
        notified.add(uid);
        const inboxItem: IInbox = {
          type: "mention",
          userId: uid,
          messageId: message.id,
          Message: message,
          happendAt,
        };
        ctx.store.inbox.push(inboxItem);
        ctx.hub.toUser(uid, "inbox::Added", {
          type: "mention",
          message: serializeMessage(message, uid),
        });
      }

      const replied =
        replyingMessageId === null
          ? undefined
          : ctx.store.messages.find((m) => m.id === replyingMessageId);
      if (
        replied !== undefined &&
        replied.userId !== ctx.userId &&
        !notified.has(replied.userId)
      ) {
        ctx.store.inbox.push({
          type: "reply",
          userId: replied.userId,
          messageId: message.id,
          Message: message,
          happendAt,
        });
        ctx.hub.toUser(replied.userId, "inbox::Added", {
          type: "reply",
          message: serializeMessage(message, replied.userId),
        });
      }

      json(ctx.res, "Message sent", serializeMessage(message, ctx.userId));
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/message\/edit$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const message = ctx.store.messages.find((m) => m.id === b.messageId);
      if (message === undefined) {
        text(ctx.res, 404, "Message not found");
        return;
      }
      if (typeof b.message === "string") message.content = b.message;
      message.isEdited = true;
      ctx.hub.broadcast("message::UpdateMessage", {
        id: message.id,
        content: message.content,
        channelId: message.channelId,
        userId: message.userId,
        isEdited: true,
        MessageUrlPreview: [],
      });
      json(ctx.res, "Message edited", serializeMessage(message, ctx.userId));
    },
  },
  {
    method: "DELETE",
    pattern: /^\/api\/message\/delete$/,
    handler: (ctx) => {
      const messageId = String(obj(ctx.body).messageId ?? "");
      const message = ctx.store.messages.find((m) => m.id === messageId);
      if (message === undefined) {
        text(ctx.res, 404, "Message not found");
        return;
      }
      ctx.store.messages = ctx.store.messages.filter((m) => m.id !== messageId);
      ctx.store.reactions = ctx.store.reactions.filter(
        (r) => r.messageId !== messageId,
      );
      ctx.store.inbox = ctx.store.inbox.filter(
        (i) => i.messageId !== messageId,
      );
      ctx.hub.broadcast("message::MessageDeleted", {
        messageId,
        channelId: message.channelId,
      });
      json(ctx.res, "Message deleted", messageId);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/message\/emoji-reaction$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const messageId = String(b.messageId ?? "");
      const channelId = String(b.channelId ?? "");
      const emojiCode = String(b.emojiCode ?? "");
      const existing = ctx.store.reactions.find(
        (r) =>
          r.messageId === messageId &&
          r.userId === ctx.userId &&
          r.emojiCode === emojiCode,
      );
      const reaction = existing ?? {
        id: uuid(),
        userId: ctx.userId,
        channelId,
        messageId,
        emojiCode,
      };
      if (existing === undefined) {
        ctx.store.reactions.push(reaction);
        ctx.hub.broadcast("message::AddReaction", reaction);
      }
      json(ctx.res, "Message reacted.", reaction);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/api\/message\/delete-emoji-reaction$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const messageId = String(b.messageId ?? "");
      const emojiCode = String(b.emojiCode ?? "");
      const index = ctx.store.reactions.findIndex(
        (r) =>
          r.messageId === messageId &&
          r.userId === ctx.userId &&
          r.emojiCode === emojiCode,
      );
      if (index === -1) {
        text(ctx.res, 404, "Reaction not found");
        return;
      }
      const [reaction] = ctx.store.reactions.splice(index, 1);
      ctx.hub.broadcast("message::DeleteReaction", reaction);
      json(ctx.res, "Message reacted.", reaction);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/message\/get-new$/,
    handler: (ctx) => {
      const data: Record<string, boolean> = {};
      for (const channel of ctx.store.channels) {
        const messages = ctx.store.messages.filter(
          (m) => m.channelId === channel.id,
        );
        if (messages.length === 0) continue;
        const readTime = ctx.store.readTimes.find(
          (r) => r.userId === ctx.userId && r.channelId === channel.id,
        );
        data[channel.id] =
          readTime === undefined
            ? true
            : messages.some(
                (m) => Date.parse(m.createdAt) > Date.parse(readTime.readTime),
              );
      }
      json(ctx.res, "Fetched news", data);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/message\/read-time\/update$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const channelId = String(b.channelId ?? "");
      const readTime = String(b.readTime ?? "");
      const existing = ctx.store.readTimes.find(
        (r) => r.userId === ctx.userId && r.channelId === channelId,
      );
      if (existing === undefined) {
        ctx.store.readTimes.push({ userId: ctx.userId, channelId, readTime });
      } else {
        existing.readTime = readTime;
      }
      ctx.hub.toUser(ctx.userId, "message::ReadTimeUpdated", {
        userId: ctx.userId,
        channelId,
        readTime,
      });
      json(ctx.res, "Message sent", {});
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/message\/read-time\/get$/,
    handler: (ctx) => {
      json(
        ctx.res,
        "Fetched read time",
        ctx.store.readTimes
          .filter((r) => r.userId === ctx.userId)
          .map((r) => ({
            userId: r.userId,
            channelId: r.channelId,
            readTime: r.readTime,
          })),
      );
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/message\/inbox$/,
    handler: (ctx) => {
      json(
        ctx.res,
        "Fetched inbox",
        ctx.store.inbox
          .filter((i) => i.userId === ctx.userId)
          .map((i) => ({
            ...i,
            Message: serializeMessage(i.Message, i.userId),
          })),
      );
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/message\/inbox\/read$/,
    handler: (ctx) => {
      const messageId = String(obj(ctx.body).messageId ?? "");
      ctx.store.inbox = ctx.store.inbox.filter(
        (i) => !(i.userId === ctx.userId && i.messageId === messageId),
      );
      json(ctx.res, "Inbox read", messageId);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/message\/who-reacted$/,
    handler: (ctx) => {
      const messageId = ctx.url.searchParams.get("messageId");
      const emojiCode = ctx.url.searchParams.get("emojiCode");
      const data = [
        ...new Set(
          ctx.store.reactions
            .filter(
              (r) => r.messageId === messageId && r.emojiCode === emojiCode,
            )
            .map((r) => r.userId),
        ),
      ];
      json(ctx.res, "Fetched reactions", data);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/message\/search$/,
    handler: (ctx) => {
      const q = ctx.url.searchParams;
      const content = q.get("content");
      const channelId = q.get("channelId");
      const userId = q.get("userId");
      const data = ctx.store.messages
        .filter(
          (m) =>
            (content === null ||
              m.content.toLowerCase().includes(content.toLowerCase())) &&
            (channelId === null || m.channelId === channelId) &&
            (userId === null || m.userId === userId),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
        )
        .slice(0, 50)
        .map((m) => serializeMessage(m, ctx.userId));
      json(ctx.res, "Searched messages", data);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/message\/file\/upload$/,
    handler: (ctx) => {
      const id = uuid();
      ctx.store.files[id] = {
        id,
        userId: ctx.userId,
        channelId: "",
        messageId: null,
        actualFileName: "uploaded-file",
        savedFileName: id,
        size: 0,
        type: "application/octet-stream",
      };
      ctx.res.statusCode = 200;
      ctx.res.setHeader("Content-Type", "application/json; charset=utf-8");
      ctx.res.end(
        JSON.stringify({
          result: "success",
          message: "File uploaded",
          data: { fileId: { id } },
        }),
      );
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/message\/url-thumbnail$/,
    handler: (ctx) => {
      ctx.res.statusCode = 200;
      ctx.res.setHeader("Content-Type", "image/png");
      ctx.res.end(PNG_1X1);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/message\/file\/([^/]+)$/,
    handler: (ctx) => {
      ctx.res.statusCode = 200;
      ctx.res.setHeader("Content-Type", "image/png");
      ctx.res.end(PNG_1X1);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/message\/([a-f0-9-]+)$/,
    handler: (ctx) => {
      const message = ctx.store.messages.find((m) => m.id === ctx.params[0]);
      if (message === undefined) {
        text(ctx.res, 404, "Message not found");
        return;
      }
      json(ctx.res, "Fetched message", serializeMessage(message, ctx.userId));
    },
  },
];
