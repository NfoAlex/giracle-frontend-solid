import type { IChannel } from "./Channel.ts";

export interface IServer {
  name: string;
  introduction: string;
  RegisterAvailable: boolean;
  RegisterInviteOnly: boolean;
  RegisterAnnounceChannelId: string;
  MessageMaxLength: number;
  MessageMaxFileSize: number;
  defaultJoinChannel: IChannel[];
}

export interface IBot {
  approveStatus: "APPROVED" | "BLOCKED" | "DENIED" | "PENDING";
  botDescription: string | null;
  botName: string;
  canFetchRoleinfo: boolean;
  canFetchUserinfo: boolean;
  canManageServerConfig: boolean;
  canManageUser: boolean;
  canReadMessage: boolean;
  canSendMessage: boolean;
  channelPermissions: IBotChannelPermission[];
  createdAt: Date;
  createdBy: string;
  id: string;
  remoteUserId: string;
  useAllChannel: boolean;
  user: {
    createdAt: Date;
    id: string;
    isBanned: boolean;
    isBot: boolean;
    isDeleted: boolean;
    name: string | null;
    selfIntroduction: string;
  };
}

export interface IBotChannelPermission {
  botId: string;
  channelId: string;
  id: number;
}

export interface IInvite {
  inviteCode: string;
  id: number;
  isActive: boolean;
  createdUserId: string;
  usedCount: number;
  maxUsage: number;
}

export interface IRequestLogCount {
  date: string;
  successCount: number;
  errorCount: number;
  otherCount: number;
}

export interface IRequestLog {
  id: string;
  method: string;
  path: string;
  status: number;
  userId: string | null;
  createdAt: Date;
}
