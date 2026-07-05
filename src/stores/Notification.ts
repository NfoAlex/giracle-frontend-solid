import { createStore } from "solid-js/store";
import type { INotificationConfig } from "~/api/NOTIFICATION/NOTIFICATION_CONFIG_GET.ts";

export const [storeNotificationConfig, setStoreNotificationConfig] =
  createStore<INotificationConfig>({
    userId: "",
    enabled: true,
    mode: "mention",
  });

export const [storeMutedChannels, setStoreMutedChannels] = createStore<{
  ids: string[];
}>({ ids: [] });

export const isChannelMuted = (channelId: string): boolean => {
  return storeMutedChannels.ids.includes(channelId);
};
