import { FETCH_CLIENT } from "../FETCH_CLIENT.ts";

export type INotificationConfig = {
  userId: string;
  enabled: boolean;
  mode: "off" | "mention" | "all";
};

export type IMutedChannel = {
  channelId: string;
  mutedAt: string;
};

export const notification = {
  configGet: () =>
    FETCH_CLIENT<{ message: "Fetched notification config"; data: INotificationConfig }>({
      url: "/api/notification/config",
      method: "GET",
      label: "NOTIFICATION_CONFIG_GET",
    }),

  configUpdate: (p: { enabled?: boolean; mode?: "off" | "mention" | "all" }) =>
    FETCH_CLIENT<{ message: "Updated notification config"; data: INotificationConfig }>({
      url: "/api/notification/config",
      method: "POST",
      body: p,
      label: "NOTIFICATION_CONFIG_UPDATE",
    }),

  deviceRegister: (p: {
    token: string;
    platform: "web" | "android" | "ios";
    keys?: { p256dh: string; auth: string };
    deviceName?: string;
  }) =>
    FETCH_CLIENT<{ message: "Device registered"; data: { id: number } }>({
      url: "/api/notification/device/register",
      method: "POST",
      body: p,
      label: "NOTIFICATION_DEVICE_REGISTER",
    }),

  deviceUnregister: (p: { token: string }) =>
    FETCH_CLIENT<{ message: "Device unregistered"; data: { token: string | null } }>({
      url: "/api/notification/device/unregister",
      method: "POST",
      body: { token: p.token },
      label: "NOTIFICATION_DEVICE_UNREGISTER",
    }),

  mutedChannels: () =>
    FETCH_CLIENT<{ message: "Fetched muted channels"; data: IMutedChannel[] }>({
      url: "/api/notification/muted-channels",
      method: "GET",
      label: "NOTIFICATION_MUTED_CHANNELS",
    }),

  muteChannel: (p: { channelId: string }) =>
    FETCH_CLIENT<{
      message: "Channel muted";
      data: { userId: string; channelId: string; mutedAt: string };
    }>({
      url: "/api/notification/mute-channel",
      method: "POST",
      body: { channelId: p.channelId },
      label: "NOTIFICATION_MUTE_CHANNEL",
    }),

  unmuteChannel: (p: { channelId: string }) =>
    FETCH_CLIENT<{ message: "Channel unmuted"; data: { channelId: string } }>({
      url: "/api/notification/unmute-channel",
      method: "POST",
      body: { channelId: p.channelId },
      label: "NOTIFICATION_UNMUTE_CHANNEL",
    }),

  vapidPublicKey: () =>
    FETCH_CLIENT<{ message: "Fetched VAPID public key"; data: { publicKey: string } }>({
      url: "/api/notification/vapid-public-key",
      method: "GET",
      label: "NOTIFICATION_VAPID_PUBLIC_KEY",
    }),
};
