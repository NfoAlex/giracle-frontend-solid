import { FETCH_CLIENT } from "../FETCH_CLIENT.ts";
import type { IChannel } from "~/types/Channel.ts";
import type { IMessage } from "~/types/Message.ts";

export const channel = {
  create: (p: { channelName: string; description: string }) =>
    FETCH_CLIENT<{
      message: `Channel created`;
      data: { channelId: string };
    }>({
      url: "/api/channel/create",
      method: "PUT",
      body: { channelName: p.channelName, description: p.description },
      label: "CHANNEL_CREATE",
    }),

  delete: (p: { channelId: string }) =>
    FETCH_CLIENT<{ message: `Channel deleted` }>({
      url: "/api/channel/delete",
      method: "DELETE",
      body: { channelId: p.channelId },
      label: "CHANNEL_DELETE",
    }),

  getHistory: (p: {
    channelId: string;
    messageIdFrom?: string | undefined;
    messageTimeFrom?: string | undefined;
    fetchLength?: number | undefined;
    fetchDirection?: "older" | "newer" | undefined;
  }) =>
    FETCH_CLIENT<{
      message: "History fetched";
      data: {
        history: IMessage[];
        ImageDimensions: {
          [fileId: string]: { width: number; height: number };
        };
        atTop: boolean;
        atEnd: boolean;
      };
    }>({
      url: `/api/channel/get-history/${p.channelId}`,
      method: "POST",
      body: {
        messageIdFrom: p.messageIdFrom ? p.messageIdFrom : undefined,
        messageTimeFrom: p.messageTimeFrom ? p.messageTimeFrom : undefined,
        fetchLength: p.fetchLength ? p.fetchLength : undefined,
        fetchDirection: p.fetchDirection ? p.fetchDirection : undefined,
      },
      label: "CHANNEL_GET_HISTORY",
    }),

  getInfo: (p: { channelId: string }) =>
    FETCH_CLIENT<{ message: "Channel info ready"; data: IChannel }>({
      url: `/api/channel/get-info/${p.channelId}`,
      method: "GET",
      label: "CHANNEL_GET_INFO",
    }),

  invite: (p: { userId: string; channelId: string }) =>
    FETCH_CLIENT<{ message: "User invited" }>({
      url: "/api/channel/invite",
      method: "POST",
      body: { userId: p.userId, channelId: p.channelId },
      label: "CHANNEL_INVITE",
    }),

  join: (p: { channelId: string }) =>
    FETCH_CLIENT<{
      message: `Channel joined`;
      data: { channelId: string };
    }>({
      url: "/api/channel/join",
      method: "POST",
      body: { channelId: p.channelId },
      label: "CHANNEL_JOIN",
    }),

  kick: (p: { userId: string; channelId: string }) =>
    FETCH_CLIENT<{ message: "User kicked" }>({
      url: "/api/channel/kick",
      method: "POST",
      body: { userId: p.userId, channelId: p.channelId },
      label: "CHANNEL_KICK",
    }),

  leave: (p: { channelId: string }) =>
    FETCH_CLIENT<{ message: `Channel left` }>({
      url: "/api/channel/leave",
      method: "POST",
      body: { channelId: p.channelId },
      label: "CHANNEL_LEAVE",
    }),

  list: () =>
    FETCH_CLIENT<{ message: "Channel list ready"; data: IChannel[] }>({
      url: "/api/channel/list",
      method: "GET",
      label: "CHANNEL_LIST",
    }),

  update: (p: {
    name?: string;
    description?: string;
    isArchived?: boolean;
    viewableRole?: string[];
    channelId: string;
  }) =>
    FETCH_CLIENT({
      url: "/api/channel/update",
      method: "POST",
      body: { ...p },
      label: "CHANNEL_UPDATE",
    }),
};
