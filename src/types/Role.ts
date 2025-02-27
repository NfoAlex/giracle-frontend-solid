export interface IRole {
  name: string;
  id: string;
  createdAt: Date;
  createdUserId: string;
  color: string;
  manageServer: boolean;
  manageChannel: boolean;
  manageRole: boolean;
  manageUser: boolean;
  manageEmoji: boolean;
}
