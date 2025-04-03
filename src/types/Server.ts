import type { IChannel } from "./Channel";

export interface IServer {
  name: string;
  introduction: string;
  RegisterAvailable: boolean;
  RegisterInviteOnly: boolean;
  RegisterAnnounceChannelId: string;
  MessageMaxLength: number;
  defaultJoinChannel: IChannel[];
}

export interface IInvite {
  inviteCode: string;
  id: number;
  isActive: boolean;
  createdUserId: string;
  usedCount: number;
}
