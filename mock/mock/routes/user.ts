import type { IRole } from "../../../src/types/Role.ts";
import type { IUser } from "../../../src/types/User.ts";
import {
  json,
  type MockCtx,
  type MockRoute,
  obj,
  parseMultipart,
  setTokenCookie,
  text,
} from "../http.ts";
import { isJoined, publicUser, userById, uuid } from "../store.ts";

const escapeXml = (value: string) => {
  const table: Record<string, string> = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
  };
  return value.replace(/[<>&"]/g, (c) => table[c] ?? c);
};

const sendSvg = (
  ctx: MockCtx,
  width: number,
  height: number,
  label: string,
) => {
  ctx.res.statusCode = 200;
  ctx.res.setHeader("Content-Type", "image/svg+xml");
  ctx.res.end(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#5865f2"/><text x="${width / 2}" y="${height * 0.65}" font-size="${Math.min(width, height) * 0.45}" text-anchor="middle" fill="white">${escapeXml(label)}</text></svg>`,
  );
};

const notificationOf = (ctx: MockCtx) => {
  const current = ctx.store.notifications[ctx.userId];
  if (current !== undefined) return current;
  const created = {
    userId: ctx.userId,
    enabled: true,
    mode: "all" as const,
  };
  ctx.store.notifications[ctx.userId] = created;
  return created;
};

export const routes: MockRoute[] = [
  {
    method: "GET",
    pattern: /^\/api\/server\/config$/,
    handler: (ctx) => {
      json(ctx.res, "Fetched server config", ctx.store.config);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/user\/verify-token$/,
    handler: (ctx) => {
      json(ctx.res, "Token is valid", { userId: ctx.userId });
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/user\/sign-in$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const user = ctx.store.users.find((u) => u.name === b.username);
      if (user === undefined || ctx.store.passwords[user.id] !== b.password) {
        text(ctx.res, 400, "Invalid credentials");
        return;
      }
      if (user.isBanned) {
        text(ctx.res, 403, "User is banned");
        return;
      }
      const session = {
        token: uuid(),
        id: ctx.store.nextSessionId++,
        name: "web",
        userId: user.id,
        createdAt: new Date().toISOString(),
      };
      ctx.store.sessions.push(session);
      setTokenCookie(ctx.res, session.token);
      json(ctx.res, `Signed in as ${user.name}`, { userId: user.id });
    },
  },
  {
    method: "PUT",
    pattern: /^\/api\/user\/sign-up$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const name = typeof b.username === "string" ? b.username : "";
      const password = typeof b.password === "string" ? b.password : "";
      if (name === "" || password === "") {
        text(ctx.res, 400, "Username and password are required");
        return;
      }
      if (ctx.store.users.some((u) => u.name === name)) {
        text(ctx.res, 400, "Username already taken");
        return;
      }
      const joinChannel = ctx.store.config.defaultJoinChannel[0];
      const user: IUser = {
        id: uuid(),
        name,
        isBanned: false,
        isBot: false,
        selfIntroduction: "",
        ChannelJoin: [],
        RoleLink: [{ roleId: "MEMBER" }],
      };
      ctx.store.users.push(user);
      ctx.store.passwords[user.id] = password;
      if (joinChannel !== undefined) {
        ctx.store.joins.push({ userId: user.id, channelId: joinChannel.id });
      }
      json(ctx.res, "User created");
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/user\/list$/,
    handler: (ctx) => {
      const q = ctx.url.searchParams;
      const length = Number(q.get("length") ?? 100) || 100;
      const username = q.get("username");
      const joinedChannel = q.get("joinedChannel");
      let users = ctx.store.users;
      if (username) users = users.filter((u) => u.name.includes(username));
      if (joinedChannel) {
        users = users.filter((u) => isJoined(u.id, joinedChannel));
      }
      json(ctx.res, "", users.slice(0, length).map(publicUser));
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/user\/info\/([^/]+)$/,
    handler: (ctx) => {
      const user = userById(ctx.params[0]);
      if (user === undefined) {
        text(ctx.res, 404, "User not found");
        return;
      }
      json(ctx.res, "User info", publicUser(user));
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/user\/get-online$/,
    handler: (ctx) => {
      json(ctx.res, "Fetched online user list", [...ctx.store.online]);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/user\/session$/,
    handler: (ctx) => {
      const sessions = ctx.store.sessions
        .filter((s) => s.userId === ctx.userId)
        .map((s) => ({
          id: s.id,
          name: s.name,
          userId: s.userId,
          thisIsYou: true,
          createdAt: s.createdAt,
        }));
      json(ctx.res, "Fetched your sessions", sessions);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/api\/user\/session$/,
    handler: (ctx) => {
      const sessionId = Number(obj(ctx.body).sessionId);
      const index = ctx.store.sessions.findIndex(
        (s) => s.id === sessionId && s.userId === ctx.userId,
      );
      if (index === -1) {
        text(ctx.res, 404, "Session not found");
        return;
      }
      ctx.store.sessions.splice(index, 1);
      json(ctx.res, "Session removed", { sessionId });
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/user\/change-session-name$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const session = ctx.store.sessions.find(
        (s) => s.id === Number(b.sessionId) && s.userId === ctx.userId,
      );
      if (session === undefined) {
        text(ctx.res, 404, "Session not found");
        return;
      }
      if (typeof b.name === "string") session.name = b.name;
      json(ctx.res, "Session name updated", {
        id: session.id,
        name: session.name,
        userId: session.userId,
        thisIsYou: true,
        createdAt: session.createdAt,
      });
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/user\/profile-update$/,
    handler: (ctx) => {
      const user = userById(ctx.userId);
      if (user === undefined) {
        text(ctx.res, 404, "User not found");
        return;
      }
      const b = obj(ctx.body);
      if (typeof b.name === "string") user.name = b.name;
      if (typeof b.selfIntroduction === "string") {
        user.selfIntroduction = b.selfIntroduction;
      }
      const updated = publicUser(user);
      ctx.hub.broadcast("user::ProfileUpdate", updated);
      json(ctx.res, "Profile updated", updated);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/user\/change-password$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      if (ctx.store.passwords[ctx.userId] !== b.currentPassword) {
        text(ctx.res, 400, "Current password is incorrect");
        return;
      }
      if (typeof b.newPassword !== "string" || b.newPassword === "") {
        text(ctx.res, 400, "New password is required");
        return;
      }
      ctx.store.passwords[ctx.userId] = b.newPassword;
      json(ctx.res, "Password changed");
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/user\/change-icon$/,
    handler: (ctx) => {
      json(ctx.res, "Icon changed");
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/user\/change-banner$/,
    handler: (ctx) => {
      json(ctx.res, "Icon changed");
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/user\/ban$/,
    handler: (ctx) => {
      const userId = String(obj(ctx.body).userId ?? "");
      const user = userById(userId);
      if (user === undefined) {
        text(ctx.res, 404, "User not found");
        return;
      }
      user.isBanned = true;
      json(ctx.res, "User banned", userId);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/user\/unban$/,
    handler: (ctx) => {
      const userId = String(obj(ctx.body).userId ?? "");
      const user = userById(userId);
      if (user === undefined) {
        text(ctx.res, 404, "User not found");
        return;
      }
      user.isBanned = false;
      json(ctx.res, "User unbanned", userId);
    },
  },
  {
    method: "GET",
    // ログイン直後は id が空のままアイコンを要求されるため空 id も受ける
    pattern: /^\/api\/user\/(icon|banner)\/([^/]*)$/,
    handler: (ctx) => {
      const initial = userById(ctx.params[1])?.name.slice(0, 1) ?? "?";
      if (ctx.params[0] === "banner") {
        sendSvg(ctx, 512, 128, initial);
      } else {
        sendSvg(ctx, 128, 128, initial);
      }
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/role\/list$/,
    handler: (ctx) => {
      json(ctx.res, "Role list", ctx.store.roles);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/role\/([^/]+)$/,
    handler: (ctx) => {
      const role = ctx.store.roles.find((r) => r.id === ctx.params[0]);
      if (role === undefined) {
        text(ctx.res, 404, "Role not found");
        return;
      }
      json(ctx.res, "Role info", role);
    },
  },
  {
    method: "PUT",
    pattern: /^\/api\/role\/create$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const role: IRole = {
        id: uuid(),
        name: typeof b.roleName === "string" ? b.roleName : "new role",
        createdAt: new Date(),
        createdUserId: ctx.userId,
        color: "#99aab5",
        manageServer: false,
        manageChannel: false,
        manageRole: false,
        manageUser: false,
        manageEmoji: false,
      };
      ctx.store.roles.push(role);
      json(ctx.res, "Role created", role);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/api\/role\/delete$/,
    handler: (ctx) => {
      const roleId = String(obj(ctx.body).roleId ?? "");
      const index = ctx.store.roles.findIndex((r) => r.id === roleId);
      if (index === -1) {
        text(ctx.res, 404, "Role not found");
        return;
      }
      ctx.store.roles.splice(index, 1);
      for (const user of ctx.store.users) {
        user.RoleLink = user.RoleLink.filter((link) => link.roleId !== roleId);
      }
      ctx.hub.broadcast("role::Deleted", { roleId });
      json(ctx.res, "Role deleted", roleId);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/role\/link$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const userId = String(b.userId ?? "");
      const roleId = String(b.roleId ?? "");
      const user = userById(userId);
      if (user === undefined) {
        text(ctx.res, 404, "User not found");
        return;
      }
      if (!user.RoleLink.some((link) => link.roleId === roleId)) {
        user.RoleLink.push({ roleId });
      }
      ctx.hub.broadcast("role::Linked", { userId, roleId });
      json(ctx.res, "Role linked");
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/role\/unlink$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const userId = String(b.userId ?? "");
      const roleId = String(b.roleId ?? "");
      const user = userById(userId);
      if (user === undefined) {
        text(ctx.res, 404, "User not found");
        return;
      }
      user.RoleLink = user.RoleLink.filter((link) => link.roleId !== roleId);
      ctx.hub.broadcast("role::Unlinked", { userId, roleId });
      json(ctx.res, "Role unlinked");
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/role\/update$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const role = ctx.store.roles.find((r) => r.id === b.roleId);
      if (role === undefined) {
        text(ctx.res, 404, "Role not found");
        return;
      }
      const roleData = obj(b.roleData);
      Object.assign(role, roleData, { id: role.id });
      ctx.hub.broadcast("role::Updated", role);
      json(ctx.res, "Role updated", role);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/server\/custom-emoji$/,
    handler: (ctx) => {
      json(ctx.res, "Fetched custom emoji", ctx.store.customEmojis);
    },
  },
  {
    method: "PUT",
    pattern: /^\/api\/server\/custom-emoji\/upload$/,
    handler: (ctx) => {
      const parts = parseMultipart(ctx.rawBody);
      const codePart = parts.find((p) => p.name === "emojiCode");
      const code = codePart?.data.toString("utf8").trim() ?? "";
      const emoji = {
        id: uuid(),
        code: code !== "" ? code : `emoji${ctx.store.customEmojis.length + 1}`,
        uploadedUserId: ctx.userId,
      };
      ctx.store.customEmojis.push(emoji);
      ctx.hub.broadcast("server::CustomEmojiUploaded", emoji);
      json(ctx.res, "Emoji uploaded", ctx.store.customEmojis);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/api\/server\/custom-emoji\/delete$/,
    handler: (ctx) => {
      const code = String(obj(ctx.body).emojiCode ?? "");
      const index = ctx.store.customEmojis.findIndex((e) => e.code === code);
      if (index === -1) {
        text(ctx.res, 404, "Emoji not found");
        return;
      }
      const [emoji] = ctx.store.customEmojis.splice(index, 1);
      ctx.hub.broadcast("server::CustomEmojiDeleted", emoji);
      json(ctx.res, "Emoji deleted", ctx.store.customEmojis);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/server\/custom-emoji\/([^/]+)$/,
    handler: (ctx) => {
      sendSvg(ctx, 64, 64, ctx.params[0].slice(0, 1));
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/server\/change-config$/,
    handler: (ctx) => {
      Object.assign(ctx.store.config, obj(ctx.body));
      json(ctx.res, "Server config updated", ctx.store.config);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/server\/change-info$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      if (typeof b.name === "string") ctx.store.config.name = b.name;
      if (typeof b.introduction === "string") {
        ctx.store.config.introduction = b.introduction;
      }
      json(ctx.res, "Server info updated", ctx.store.config);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/server\/get-invite$/,
    handler: (ctx) => {
      json(ctx.res, "Fetched invites", []);
    },
  },
  {
    method: "PUT",
    pattern: /^\/api\/server\/create-invite$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      json(ctx.res, "Server invite created", {
        inviteCode: String(b.inviteCode ?? ""),
        id: 1,
        isActive: true,
        createdUserId: ctx.userId,
        usedCount: 0,
        maxUsage: typeof b.maxUsage === "number" ? b.maxUsage : 0,
      });
    },
  },
  {
    method: "DELETE",
    pattern: /^\/api\/server\/delete-invite$/,
    handler: (ctx) => {
      json(ctx.res, "Server invite deleted", {
        inviteId: obj(ctx.body).inviteId,
      });
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/server\/log$/,
    handler: (ctx) => {
      json(ctx.res, "Fetched logs", []);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/server\/log-group$/,
    handler: (ctx) => {
      json(ctx.res, "Fetched log group", { group: [], firstDayLog: undefined });
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/(?:server\/)?bot\/(?:list|all)$/,
    handler: (ctx) => {
      json(ctx.res, "Bot list fetched", []);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/(?:server\/)?bot\/set-approve$/,
    handler: (ctx) => {
      json(ctx.res, "Bot updated");
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/(?:server\/)?bot\/([^/]+)$/,
    handler: (ctx) => {
      text(ctx.res, 404, "Bot not found");
    },
  },
  {
    method: "PUT",
    pattern: /^\/api\/(?:server\/)?bot$/,
    handler: (ctx) => {
      json(ctx.res, "Bot created");
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/(?:server\/)?bot$/,
    handler: (ctx) => {
      json(ctx.res, "Bot user updated");
    },
  },
  {
    method: "DELETE",
    pattern: /^\/api\/(?:server\/)?bot$/,
    handler: (ctx) => {
      json(ctx.res, "Bot deleted");
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/notification\/config$/,
    handler: (ctx) => {
      json(ctx.res, "Fetched notification config", notificationOf(ctx));
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/notification\/config$/,
    handler: (ctx) => {
      const b = obj(ctx.body);
      const config = notificationOf(ctx);
      if (typeof b.enabled === "boolean") config.enabled = b.enabled;
      if (b.mode === "off" || b.mode === "mention" || b.mode === "all") {
        config.mode = b.mode;
      }
      json(ctx.res, "Updated notification config", config);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/notification\/muted-channels$/,
    handler: (ctx) => {
      json(
        ctx.res,
        "Fetched muted channels",
        ctx.store.muted
          .filter((m) => m.userId === ctx.userId)
          .map((m) => ({ channelId: m.channelId, mutedAt: m.mutedAt })),
      );
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/notification\/mute-channel$/,
    handler: (ctx) => {
      const channelId = String(obj(ctx.body).channelId ?? "");
      const existing = ctx.store.muted.find(
        (m) => m.userId === ctx.userId && m.channelId === channelId,
      );
      const entry = existing ?? {
        userId: ctx.userId,
        channelId,
        mutedAt: new Date().toISOString(),
      };
      if (existing === undefined) ctx.store.muted.push(entry);
      json(ctx.res, "Channel muted", entry);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/notification\/unmute-channel$/,
    handler: (ctx) => {
      const channelId = String(obj(ctx.body).channelId ?? "");
      ctx.store.muted = ctx.store.muted.filter(
        (m) => !(m.userId === ctx.userId && m.channelId === channelId),
      );
      json(ctx.res, "Channel unmuted", { channelId });
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/notification\/vapid-public-key$/,
    handler: (ctx) => {
      json(ctx.res, "Fetched VAPID public key", { publicKey: "" });
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/notification\/device\/register$/,
    handler: (ctx) => {
      json(ctx.res, "Device registered", { id: 1 });
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/notification\/device\/unregister$/,
    handler: (ctx) => {
      json(ctx.res, "Device unregistered", { token: null });
    },
  },
];
