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

export interface IInvite {
  inviteCode: string;
  id: number;
  isActive: boolean;
  createdUserId: string;
  usedCount: number;
}
