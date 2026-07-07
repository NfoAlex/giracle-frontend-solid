import { channel } from "./domains/channel.ts";
import { message } from "./domains/message.ts";
import { notification } from "./domains/notification.ts";
import { role } from "./domains/role.ts";
import { server } from "./domains/server.ts";
import { user } from "./domains/user.ts";

export const api = {
  channel,
  message,
  notification,
  role,
  server,
  user,
} as const;
