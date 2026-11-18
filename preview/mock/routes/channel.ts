import type { IChannel } from "../../../src/types/Channel.ts";
import { json, type MockRoute, text } from "../http.ts";
import {
  canViewChannel,
  channelMessages,
  isJoined,
  serializeMessage,
  uuid,
} from "../store.ts";

const obj = (body: unknown): Record<string, unknown> =>
  body !== null && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};

export const routes: MockRoute[] = [
  {
    method: "GET",
    pattern: /^\/api\/channel\/list$/,
    handler: (ctx) => {
      json(
        ctx.res,
        "Channel list ready",
        ctx.store.channels.filter((c) => canViewChannel(ctx.userId, c)),
      );
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/channel\/get-info\/([^/]+)$/,
    handler: (ctx) => {
      const channel = ctx.store.channels.find((c) => c.id === ctx.params[0]);
      if (channel === undefined) {
        text(ctx.res, 404, "Channel not found");
        return;
      }
      json(ctx.res, "Channel info ready", channel);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/channel\/get-history\/([^/]+)$/,
    handler: (ctx) => {
      const channelId = ctx.params[0];
      if (!ctx.store.channels.some((c) => c.id === channelId)) {
        text(ctx.res, 404, "Channel not found");
        return;
      }
      const b = obj(ctx.body);
      const list = channelMessages(channelId);
      const len =
        typeof b.fetchLength === "number" && b.fetchLength > 0
          ? b.fetchLength
          : 20;

      let history = [] as typeof list;
      let atTop = false;
      let atEnd = false;

      const indexFrom =
        typeof b.messageIdFrom === "string" && b.messageIdFrom !== ""
          ? list.findIndex((m) => m.id === b.messageIdFrom)
          : -1;

      if (indexFrom !== -1) {
        if (b.fetchDirection === "newer") {
          const start = Math.max(0, indexFrom - len);
          history = list.slice(start, indexFrom);
          atEnd = start === 0;
          atTop = false;
        } else {
          history = list.slice(indexFrom + 1, indexFrom + 1 + len);
          atTop = indexFrom + 1 + len >= list.length;
          atEnd = false;
        }
      } else if (
        typeof b.messageTimeFrom === "string" &&
        b.messageTimeFrom !== ""
      ) {
        const time = Date.parse(b.messageTimeFrom);
        history = list
          .filter((m) => Date.parse(m.createdAt) >= time)
          .slice(0, 50);
        atEnd = true;
        atTop = !list.some((m) => Date.parse(m.createdAt) < time);
      } else {
        // 初回表示は読み込み直後の既読時間未取得レースでも 30 件以上出すため多めに返す
        const initialLen = Math.max(len, 50);
        history = list.slice(0, initialLen);
        atEnd = true;
        atTop = initialLen >= list.length;
      }

      json(ctx.res, "History fetched", {
        history: history.map((m) => serializeMessage(m, ctx.userId)),
        ImageDimensions: Object.fromEntries(
          history
            .flatMap((m) => m.MessageFileAttached)
            .map((f) => [f.id, { width: 800, height: 600 }]),
        ),
        atTop,
        atEnd,
      });
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/channel\/join$/,
    handler: (ctx) => {
      const channelId = String(obj(ctx.body).channelId ?? "");
      if (!ctx.store.channels.some((c) => c.id === channelId)) {
        text(ctx.res, 404, "Channel not found");
        return;
      }
      if (!isJoined(ctx.userId, channelId)) {
        ctx.store.joins.push({ userId: ctx.userId, channelId });
      }
      ctx.hub.toUser(ctx.userId, "channel::Join", { channelId });
      json(ctx.res, "Channel joined", { channelId });
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/channel\/leave$/,
    handler: (ctx) => {
      const channelId = String(obj(ctx.body).channelId ?? "");
      ctx.store.joins = ctx.store.joins.filter(
        (j) => !(j.userId === ctx.userId && j.channelId === channelId),
      );
      ctx.hub.toUser(ctx.userId, "channel::Left", { channelId });
      json(ctx.res, "Channel left");
    },
  },
  {
    method: "PUT",
    pattern: /^\/api\/channel\/create$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const channel: IChannel = {
        id: uuid(),
        name: typeof b.channelName === "string" ? b.channelName : "new-channel",
        description: typeof b.description === "string" ? b.description : "",
        createdUserId: ctx.userId,
        isArchived: false,
        ChannelViewableRole: [],
      };
      ctx.store.channels.push(channel);
      ctx.store.joins.push({ userId: ctx.userId, channelId: channel.id });
      json(ctx.res, "Channel created", { channelId: channel.id });
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/channel\/update$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const channel = ctx.store.channels.find((c) => c.id === b.channelId);
      if (channel === undefined) {
        text(ctx.res, 404, "Channel not found");
        return;
      }
      if (typeof b.name === "string") channel.name = b.name;
      if (typeof b.description === "string")
        channel.description = b.description;
      if (typeof b.isArchived === "boolean") channel.isArchived = b.isArchived;
      if (Array.isArray(b.viewableRole)) {
        channel.ChannelViewableRole = b.viewableRole
          .filter((r): r is string => typeof r === "string")
          .map((roleId) => ({ roleId }));
      }
      ctx.hub.broadcast("channel::UpdateChannel", channel);
      json(ctx.res, "Channel updated", channel);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/api\/channel\/delete$/,
    handler: (ctx) => {
      const channelId = String(obj(ctx.body).channelId ?? "");
      const index = ctx.store.channels.findIndex((c) => c.id === channelId);
      if (index === -1) {
        text(ctx.res, 404, "Channel not found");
        return;
      }
      ctx.store.channels.splice(index, 1);
      ctx.store.joins = ctx.store.joins.filter(
        (j) => j.channelId !== channelId,
      );
      ctx.hub.broadcast("channel::Deleted", { channelId });
      json(ctx.res, "Channel deleted");
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/channel\/invite$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const userId = String(b.userId ?? "");
      const channelId = String(b.channelId ?? "");
      if (!isJoined(userId, channelId)) {
        ctx.store.joins.push({ userId, channelId });
      }
      ctx.hub.toUser(userId, "channel::Join", { channelId });
      json(ctx.res, "User invited");
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/channel\/kick$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const userId = String(b.userId ?? "");
      const channelId = String(b.channelId ?? "");
      ctx.store.joins = ctx.store.joins.filter(
        (j) => !(j.userId === userId && j.channelId === channelId),
      );
      ctx.hub.toUser(userId, "channel::Left", { channelId });
      json(ctx.res, "User kicked");
    },
  },
];
