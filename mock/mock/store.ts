import type { IChannel } from "../../src/types/Channel.ts";
import type {
  ICustomEmoji,
  IInbox,
  IMessage,
  IMessageFileAttached,
  IReaciton,
} from "../../src/types/Message.ts";
import type { IRole } from "../../src/types/Role.ts";
import type { IServer } from "../../src/types/Server.ts";
import type { IUser } from "../../src/types/User.ts";
import { createSeed } from "./data.ts";

export interface IMockSession {
  token: string;
  id: number;
  name: string;
  userId: string;
  createdAt: string;
}

export interface IMockServerConfig extends IServer {
  isFirstUser: boolean;
}

/** data.ts が生成するシード部分 */
export interface IMockSeed {
  users: IUser[];
  passwords: Record<string, string>;
  roles: IRole[];
  channels: IChannel[];
  messages: IMessage[];
  reactions: IReaciton[];
  joins: { userId: string; channelId: string }[];
  readTimes: { userId: string; channelId: string; readTime: string }[];
  inbox: IInbox[];
  customEmojis: ICustomEmoji[];
  files: Record<string, IMessageFileAttached>;
  config: IMockServerConfig;
}

export interface IMockStore extends IMockSeed {
  sessions: IMockSession[];
  online: Set<string>;
  nextSessionId: number;
  muted: { userId: string; channelId: string; mutedAt: string }[];
  notifications: Record<
    string,
    { userId: string; enabled: boolean; mode: "off" | "mention" | "all" }
  >;
}

/** WS 送信用。ws.ts が実体を差し込む */
export interface MockHub {
  broadcast(signal: string, data: unknown): void;
  toUser(userId: string, signal: string, data: unknown): void;
}

export const hub: MockHub = {
  broadcast() {},
  toUser() {},
};

export const store: IMockStore = {
  ...createSeed(),
  sessions: [],
  online: new Set<string>(),
  nextSessionId: 1,
  muted: [],
  notifications: {},
};

export const uuid = () => crypto.randomUUID();

export const userById = (userId: string) =>
  store.users.find((u) => u.id === userId);

export const isJoined = (userId: string, channelId: string) =>
  store.joins.some((j) => j.userId === userId && j.channelId === channelId);

/** 参加情報を合成したユーザー（API 応答用） */
export const publicUser = (user: IUser): IUser => ({
  ...user,
  ChannelJoin: store.joins
    .filter((j) => j.userId === user.id)
    .map((j) => ({ channelId: j.channelId })),
});

/** 閲覧可能チャンネルか（viewableRole 空 = 全員可、manageServer 保有者は全可） */
export const canViewChannel = (userId: string, channel: IChannel) => {
  if (channel.ChannelViewableRole.length === 0) return true;
  const user = userById(userId);
  if (user === undefined) return false;
  return user.RoleLink.some((link) => {
    if (link.roleId === "HOST") return true;
    const role = store.roles.find((r) => r.id === link.roleId);
    if (role?.manageServer) return true;
    return channel.ChannelViewableRole.some((v) => v.roleId === link.roleId);
  });
};

/** チャンネルのメッセージ（新しい順） */
export const channelMessages = (channelId: string) =>
  store.messages
    .filter((m) => m.channelId === channelId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
    );

/** リアクションサマリを合成したメッセージ（API/WS 応答用） */
export const serializeMessage = (
  message: IMessage,
  viewerId: string,
): IMessage => {
  const summary = new Map<
    string,
    { emojiCode: string; count: number; includingYou: boolean }
  >();
  for (const reaction of store.reactions) {
    if (reaction.messageId !== message.id) continue;
    const entry = summary.get(reaction.emojiCode);
    if (entry === undefined) {
      summary.set(reaction.emojiCode, {
        emojiCode: reaction.emojiCode,
        count: 1,
        includingYou: reaction.userId === viewerId,
      });
    } else {
      entry.count++;
      entry.includingYou = entry.includingYou || reaction.userId === viewerId;
    }
  }
  return {
    ...message,
    reactionSummary: [...summary.values()],
    MessageFileAttached: message.MessageFileAttached.map(
      (file) => store.files[file.id] ?? file,
    ),
  };
};
