export interface IChannel {
  name: string;
  id: string;
  description: string;
  createdUserId: string;
  isArchived: boolean;
  channelViewableRoles: { roleId: string;}[];
}
